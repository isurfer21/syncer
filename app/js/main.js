// @file main.js

String.prototype.graft = function() {
    let self = this;
    if (arguments.length == 1 && typeof arguments[0] == 'object' && !Array.isArray(arguments[0])) {
        for (let arg in arguments[0]) {
            self = self.replace(new RegExp('\\[' + arg + '\\]', 'g'), arguments[0][arg]);
        }
    } else {
        for (let i = 0; i < arguments.length; i++) {
            self = self.replace(new RegExp('\\[' + i + '\\]', 'g'), arguments[i]);
        }
    }
    return self;
};

class Storage {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Storage();
        }
        return this.instance;
    }
    constructor() {}
    setId(sid, uid) {
        this.STORAGE = sid + ((!!uid) ? '_' + uid : '');
    }
    clear(data) {
        localStorage.removeItem(this.STORAGE);
    }
    store(data) {
        localStorage.setItem(this.STORAGE, JSON.stringify(data));
    }
    retrieve() {
        if (localStorage.getItem(this.STORAGE) !== null) {
            return JSON.parse(localStorage.getItem(this.STORAGE));
        }
        return null;
    }
    admittance(proceed) {
        if (this.retrieve() !== null) {
            proceed();
        }
    }
}

class TabController {
    TAB_ITEM = '.nc-tab-item__[0]'
    TAB_CONTENT = '.nc-tab-content__[0]'
    DATA_ID = '[data-id="[1]"]'
    constructor() {}
    activateTab(tid) {
        this.tabs.removeClass('active');
        this.boxes.hide();
        let tab = this.container.find((this.TAB_ITEM + this.DATA_ID).graft(this.prefix, tid));
        let box = this.container.find((this.TAB_CONTENT + this.DATA_ID).graft(this.prefix, tid));
        tab.addClass('active');
        box.show();
    }
    onClickTab(e) {
        e.preventDefault();
        let tid = $(e.currentTarget).attr('data-id');
        this.activateTab(tid);
    }
    destroy() {
        this.tabs.off('click', this.onClickTab.bind(this));
    }
    initialize(container, prefix) {
        this.prefix = prefix
        this.container = $('#' + container);
        this.tabs = this.container.find(this.TAB_ITEM.graft(prefix));
        this.boxes = this.container.find(this.TAB_CONTENT.graft(prefix));
        this.boxes.hide();
        this.tabs.on('click', this.onClickTab.bind(this));
    }
}

class Feedback {
    constructor(container) {
        this.container = container;
    }
    onClick(e) {
        this.hide();
    }
    show(type, message) {
        this.container.removeClass('info success warning danger');
        this.container.addClass(type);
        this.container.html(message);
        this.container.show();
    }
    info(message) {
        this.show('info', message);
    }
    success(message) {
        this.show('success', message);
    }
    warning(message) {
        this.show('warning', message);
    }
    danger(message) {
        this.show('danger', message);
    }
    hide() {
        this.container.hide();
    }
    destroy() {
        this.container.off('click', this.onClick.bind(this));
    }
    initialize() {
        this.container.on('click', this.onClick.bind(this));
        this.hide();
    }
}

class Setting {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Setting();
        }
        return this.instance;
    }
    constructor() {
        this.storage = Storage.getInstance();
        this.tagCtrl = Exclusions.getInstance();
    }
    isEmpty(property) {
        return (property === null || property === "" || typeof property === "undefined");
    }
    refresh() {
        this.storage.store(this.database);
        Sidebar.getInstance().render();
        Search.getInstance().refresh();
        this.feedback.hide();
    }
    onSubmit(e) {
        e.preventDefault();
        if (this.isEmpty(this.fieldTitle.val())) {
            this.feedback.danger('Error: Title field is required');
        } else if (this.isEmpty(this.fieldDescription.val())) {
            this.feedback.danger('Error: Description field is required');
        } else if (this.isEmpty(this.fieldSourcePath.val())) {
            this.feedback.danger('Error: SourcePath field is required');
        } else if (this.isEmpty(this.fieldGaragePath.val())) {
            this.feedback.danger('Error: GaragePath field is required');
        } else {
            let cargo = {
                title: this.fieldTitle.val(),
                description: this.fieldDescription.val(),
                sourcepath: this.fieldSourcePath.val(),
                garagepath: this.fieldGaragePath.val(),
                exclusions: this.tagCtrl.list
            }
            if (!!this.editing) {
                this.database[this.index] = cargo;
            } else {
                this.database.push(cargo);
            }
            this.refresh();
            this.feedback.success('Saved!');
        }
    }
    onClear(e) {
        this.editing = false;
        this.tagCtrl.list = [];
        this.tagCtrl.render();
        this.trash.hide();
    }
    onTrash(e) {
        if (!!this.editing) {
            this.database.splice(this.index, 1);
            this.onClear(e);
            this.refresh();
            this.feedback.success('Deleted!');
        }
    }
    onExclude(e) {
        let excludeItem = this.fieldExclusion.val();
        this.tagCtrl.create(excludeItem);
        this.fieldExclusion.val('');
    }
    update(index) {
        this.editing = true;
        this.index = index;
        let cargo = this.database[index];
        this.fieldTitle.val(cargo.title);
        this.fieldDescription.val(cargo.description);
        this.fieldSourcePath.val(cargo.sourcepath);
        this.fieldGaragePath.val(cargo.garagepath);
        this.tagCtrl.list = cargo.exclusions;
        this.tagCtrl.render();
        this.trash.show();
    }
    destroy() {
        this.submit.off('click', this.onSubmit.bind(this));
        this.clear.off('click', this.onClear.bind(this));
    }
    initialize(containerId) {
        this.editing = false;
        this.cid = containerId;
        this.container = $('#' + this.cid);
        this.form = this.container.find('form[data-id="setting"]');

        this.feedback = new Feedback(this.form.find('.nc-feedback'));
        this.feedback.initialize();

        this.fieldTitle = this.form.find('input[name="title"]');
        this.fieldDescription = this.form.find('textarea[name="description"]');
        this.fieldSourcePath = this.form.find('input[name="sourcepath"]');
        this.fieldGaragePath = this.form.find('input[name="garagepath"]');
        this.fieldExclusion = this.form.find('input[name="exclusion"]');

        this.exclude = this.form.find('button[for="exclusion"]');
        this.exclude.on('click', this.onExclude.bind(this));

        this.submit = this.form.find('button[type="submit"]');
        this.submit.on('click', this.onSubmit.bind(this));

        this.clear = this.form.find('button[type="reset"]');
        this.clear.on('click', this.onClear.bind(this));

        this.trash = this.form.find('button[name="trash"]');
        this.trash.on('click', this.onTrash.bind(this));
        this.trash.hide();

        this.tagCtrl.initialize(this.cid, 'exclusions');

        this.database = this.storage.retrieve();
        if (!this.database) {
            this.database = [];
        }
    }
}

class Sidebar {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Sidebar();
        }
        return this.instance;
    }
    constructor() {
        this.storage = Storage.getInstance();
    }
    genItem(title, description, index) {
        return `<li class="nc-list-item__[3] list-group-item" data-index="[2]">
            <div class="media-body">
                <strong>[0]</strong>
                <p>[1]</p>
            </div>
        </li>`.graft(title, description, index, this.cid);
    }
    onClickItem(e) {
        let index = $(e.currentTarget).data('index');
        Setting.getInstance().update(index);
        Action.getInstance().view(index);
    }
    render() {
        this.database = this.storage.retrieve();
        if (!!this.database) {
            let list = [];
            for (let i = 0; i < this.database.length; i++) {
                list.push(this.genItem(this.database[i].title, this.database[i].description, i));
            }
            if (!!this.listItems) {
                this.listItems.off('click', this.onClickItem.bind(this));
            }
            this.listWrapper.html(list.join('\n'));
            this.listItems = this.listWrapper.find('.nc-list-item__[0]'.graft(this.cid));
            this.listItems.on('click', this.onClickItem.bind(this));
        }
    }
    filter(list) {
        for (let i = 0; i < this.database.length; i++) {
            if (list.indexOf(i) >= 0) {
                $(this.listItems[i]).show();
            } else {
                $(this.listItems[i]).hide();
            }
        }
    }
    destroy() {
        this.listWrapper.html('');
    }
    initialize(containerId) {
        this.cid = containerId
        this.container = $('#' + this.cid);
        this.listSearch = this.container.find('.nc-list-search__[0]'.graft(this.cid));
        this.listWrapper = this.container.find('.nc-list-wrapper__[0]'.graft(this.cid));
        this.render();
        let height = this.container.outerHeight() - this.listSearch.outerHeight();
        this.listWrapper.css('height', height);
    }
}

class Search {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Search();
        }
        return this.instance;
    }
    constructor() {
        this.storage = Storage.getInstance();
    }
    onKeyUp(e) {
        let searchStr = this.fieldSearch.val();
        if (!!this.database & this.database.length > 0) {
            let list = [];
            for (let i = 0; i < this.database.length; i++) {
                if (this.database[i].title.indexOf(searchStr) >= 0 || this.database[i].description.indexOf(searchStr) >= 0) {
                    list.push(i);
                }
            }
            Sidebar.getInstance().filter(list);
        }
    }
    refresh() {
        this.database = this.storage.retrieve();
    }
    destroy() {
        this.fieldSearch.off('keyup', this.onKeyUp.bind(this));
    }
    initialize(containerId) {
        this.cid = containerId
        this.container = $('#' + this.cid);
        this.fieldSearch = this.container.find('.nc-list-search__[0] input'.graft(this.cid));
        this.fieldSearch.on('keyup', this.onKeyUp.bind(this));
        this.refresh();
    }
}

class Exclusions {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Exclusions();
        }
        return this.instance;
    }
    constructor() {}
    render() {
        let tags = [];
        for (let i = 0; i < this.list.length; i++) {
            tags.push(`<span class="nc-tag" data-id="[0]">
                <span class="ns-label">[1]</span>
                <span class="nc-button icon icon-cancel"></span>
            </span>`.graft(i, this.list[i]));
        }
        this.container.find('.nc-button').off('click', this.remove.bind(this));
        this.container.html(tags.join(''));
        this.container.find('.nc-button').on('click', this.remove.bind(this));
    }
    remove(e) {
        let index = $(e.currentTarget).parent().data('id');
        this.list.splice(index, 1);
        this.render();
    }
    create(label) {
        this.list.push(label);
        this.render();
    }
    initialize(containerId, fieldId) {
        this.cid = containerId;
        this.container = $('#' + this.cid + ' .nc-tag-box__' + fieldId);
        this.list = [];
    }
}

class Action {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Action();
        }
        return this.instance;
    }
    constructor() {
        this.storage = Storage.getInstance();
        this.tunnel = new Tunnel();
        this.session = null;
    }
    view(index) {
        this.index = index;
        this.database = this.storage.retrieve();
        this.cargo = this.database[index];
        let content = '<fieldset><legend>[0]</legend>[1]</fieldset>'.graft(this.cargo.title, this.cargo.description);
        this.instruction.html(content);
    }
    onFailure(options, status, error) {
        // console.log('Action.onFailure', status, error);
        this.feedback.danger('[0]: [1]'.graft(status, error));
    }
    detectOS() {
        var os = "Unknown OS";
        if (navigator.appVersion.indexOf("Win") != -1) {
            os = "Windows";
        }
        if (navigator.appVersion.indexOf("Mac") != -1) {
            os = "MacOS";
        }
        if (navigator.appVersion.indexOf("X11") != -1) {
            os = "UNIX";
        }
        if (navigator.appVersion.indexOf("Linux") != -1) {
            os = "Linux";
        }
        return os;
    }
    getSession(token) {
        console.log('Action.getSession', token);
        this.session = token;
    }
    getResponse(result) {
        console.log('Action.getResponse', result);
        if (!!result) {
            if (result.out != '') {
                Topbar.getInstance().controller.activateTab('output');
            } else if (result.err != '') {
                Topbar.getInstance().controller.activateTab('error');
            }
            Output.getInstance().content(result);
            Error.getInstance().content(result);
        }
    }
    genCommand(syncWay) {
        console.log('Action.genCommand', syncWay);
        let cmd = '';
        let pl = {};
        if (syncWay == 's2g') {
            pl = {
                source: this.cargo.sourcepath,
                destiny: this.cargo.garagepath,
                exclude: this.cargo.exclusions
            };
        } else {
            pl = {
                source: this.cargo.garagepath,
                destiny: this.cargo.sourcepath,
                exclude: this.cargo.exclusions
            };
        }
        switch (this.detectOS()) {
            case 'Windows':
                cmd = 'ROBOCOPY [source]\ [destiny]\ /MIR /FFT /Z /XA:H /W:5 /XD [exclude]'.graft(pl);
                break;
            case 'MacOS':
                cmd = 'rsync -av "[source]/" "[destiny]/" --delete [exclude]'.graft(pl);
                break;
            case 'UNIX':
                cmd = 'rsync -av "[source]/" "[destiny]/" --delete [exclude]'.graft(pl);
                break;
            case 'Linux':
                cmd = 'rsync -av "[source]/" "[destiny]/" --delete [exclude]'.graft(pl);
                break;
            default:
        }
    }
    onSubmit(e) {
        e.preventDefault();
        if (!!this.cargo) {
            let syncDirection = this.fieldSyncDirection.val();
            // console.log('onSubmit', syncDirection);
            if (!!this.session) {
                this.tunnel.terminal(this.genCommand(syncDirection), this.session, this.getResponse, this.onFailure);
            } else {
                this.feedback.danger('Error: Unauthorized session');
            }
        } else {
            this.feedback.danger('Error: No item is selected');
        }
    }
    initialize(containerId) {
        this.cid = containerId;
        this.container = $('#' + this.cid);
        this.form = this.container.find('form[data-id="action"]');

        this.feedback = new Feedback(this.form.find('.nc-feedback'));
        this.feedback.initialize();

        this.instruction = this.form.find('.nc-instruction');

        this.fieldSyncDirection = this.form.find('select[name="syncdirection"]');

        this.submit = this.form.find('button[type="submit"]');
        this.submit.on('click', this.onSubmit.bind(this));

        this.tunnel.session(this.getSession.bind(this), this.onFailure);
    }
}

class Output {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Output();
        }
        return this.instance;
    }
    content(data) {
        if (data.out != '') {
            let str = '≻ [0]\n\n[1]'.graft(data.cmd, data.out);
            this.output.text(str);
        }
    }
    initialize(containerId) {
        this.cid = containerId;
        this.container = $('#' + this.cid);
        this.output = this.container.find('pre[data-id="output"]');
    }
}

class Error {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Error();
        }
        return this.instance;
    }
    content(data) {
        if (data.err != '') {
            let str = '$ [0]\n\n[1]'.graft(data.cmd, data.err);
            this.error.text(str);
        }
    }
    initialize(containerId) {
        this.cid = containerId;
        this.container = $('#' + this.cid);
        this.error = this.container.find('pre[data-id="error"]');
    }
}

class Topbar {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Topbar();
        }
        return this.instance;
    }
    initialize(containerId) {
        this.controller = new TabController();
        this.controller.initialize(containerId, 'topbar');
        this.controller.activateTab('input');
    }
}

class InputTopbar {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new InputTopbar();
        }
        return this.instance;
    }
    initialize(containerId) {
        this.controller = new TabController();
        this.controller.initialize(containerId, 'inputtopbar');
        this.controller.activateTab('action');
    }
}

$(function() {
    let storage = Storage.getInstance();
    storage.setId('syncer', 'setting');

    let appSidebar = Sidebar.getInstance();
    let appSearch = Search.getInstance();
    let appInputSetting = Setting.getInstance();
    let appInputAction = Action.getInstance();
    let appOutput = Output.getInstance();
    let appError = Error.getInstance();

    appSidebar.initialize('appsidebar');
    appSearch.initialize('appsidebar');
    appInputSetting.initialize('appcontainer');
    appInputAction.initialize('appcontainer');
    appOutput.initialize('appcontainer');
    appError.initialize('appcontainer');

    let appTopbar = Topbar.getInstance();
    appTopbar.initialize('appcontainer');

    let appInputTopbar = InputTopbar.getInstance();
    appInputTopbar.initialize('appcontainer');
});