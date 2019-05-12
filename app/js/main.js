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
    onActivateTab(watcher) {
        this.watcher = watcher;
    }
    onClickTab(e) {
        e.preventDefault();
        let tid = $(e.currentTarget).attr('data-id');
        this.activateTab(tid);
        if (!!this.watcher) {
            this.watcher(tid);
        }
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
        this.tagExcluder = Exclusions.getInstance();
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
        } else if (this.isEmpty(this.fieldUsername.val())) {
            this.feedback.danger('Error: SPasswordfield is required');
        } else if (this.isEmpty(this.fieldGaragePath.val())) {
            this.feedback.danger('Error: GaragePath field is required');
        } else {
            let cargo = {
                title: this.fieldTitle.val(),
                description: this.fieldDescription.val(),
                sourcepath: this.fieldSourcePath.val(),
                garagepath: this.fieldGaragePath.val(),
                exclusions: this.tagExcluder.list
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
        this.tagExcluder.list = [];
        this.tagExcluder.render();
        this.trash.hide();
        this.submit.html('Submit');
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
        this.tagExcluder.create(excludeItem);
        this.fieldExclusion.val('');
    }
    view(index) {
        this.editing = true;
        this.index = index;
        this.database = this.storage.retrieve();
        let cargo = this.database[index];
        this.fieldTitle.val(cargo.title);
        this.fieldDescription.val(cargo.description);
        this.fieldSourcePath.val(cargo.sourcepath);
        this.fieldGaragePath.val(cargo.garagepath);
        this.tagExcluder.list = cargo.exclusions;
        this.tagExcluder.render();
        this.trash.show();
        this.submit.html('Save');
    }
    deactivate() {
        this.onClear();
        this.form.trigger('reset');
        this.feedback.hide();
    }
    activate() {
        if (this.index != undefined) {
            this.view(this.index);
        }
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

        this.tagExcluder.initialize(this.cid, 'exclusions');

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
        Setting.getInstance().view(index);
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
        if (!!this.database && this.database.length > 0) {
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
    getListAsString(listicle, delimiter, prefix) {
        let output = '',
            list = [];
        if (!!listicle) {
            for (let i = 0; i < listicle.length; i++) {
                list.push('[0]"[1]"'.graft(((!!prefix) ? prefix : ''), listicle[i]));
            }
            output = list.join(delimiter);
        }
        return output;
    };
    genCommand(syncWay) {
        console.log('Action.genCommand', syncWay);
        let cmd = '';
        let pl = {};
        if (syncWay == 's2g') {
            pl = {
                source: this.cargo.sourcepath,
                destiny: this.cargo.garagepath
            };
        } else {
            pl = {
                source: this.cargo.garagepath,
                destiny: this.cargo.sourcepath
            };
        }
        switch (this.detectOS()) {
            case 'Windows':
                pl.exclude = this.getListAsString(this.cargo.exclusions, ' ');
                cmd = 'ROBOCOPY [source]\ [destiny]\ /MIR /FFT /Z /XA:H /W:5 /XD [exclude]'.graft(pl);
                break;
            case 'MacOS':
            case 'UNIX':
            case 'Linux':
                pl.exclude = this.getListAsString(this.cargo.exclusions, ' ', '--exclude=');
                cmd = 'rsync -av "[source]/" "[destiny]/" --delete [exclude]'.graft(pl);
                break;
        }
        return cmd;
    }
    onSubmit(e) {
        e.preventDefault();
        if (!!this.cargo) {
            let syncDirection = this.fieldSyncDirection.val();
            if (!!this.session) {
                this.tunnel.terminal(this.genCommand.bind(this, syncDirection), this.session, this.getResponse.bind(this), this.onFailure.bind(this));
            } else {
                this.feedback.danger('Error: Unauthorized session');
            }
        } else {
            this.feedback.danger('Error: No item is selected');
        }
    }
    onClear() {
        this.instruction.html('');
        this.form.trigger('reset');
    }
    deactivate() {
        this.onClear();
        this.feedback.hide();
    }
    activate() {
        if (this.index != undefined) {
            this.view(this.index);
        }
    }
    ready() {        
        this.tunnel.session(Login.getInstance().apiKey, this.getSession.bind(this), this.onFailure.bind(this));
    }
    destroy() {
        this.submit.off('click', this.onSubmit.bind(this));
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
    onChange(activeTab) {
        switch (activeTab) {
            case 'action':
                Setting.getInstance().deactivate();
                Action.getInstance().activate();
                break;
            case 'setting':
                Action.getInstance().deactivate();
                Setting.getInstance().activate();
                break;
        }
    }
    initialize(containerId) {
        this.controller = new TabController();
        this.controller.initialize(containerId, 'inputtopbar');
        this.controller.activateTab('action');
        this.controller.onActivateTab(this.onChange.bind(this));
    }
}

class Modal {
    constructor(container) {
        this.container = $(container);
    }
    open() {
        this.container.show();
        this.appOverlay.show();
    }
    close() {
        this.container.hide();
        this.appOverlay.hide();
    }
    destroy() {
        this.btnClose.off('click', this.close.bind(this));
        this.appOverlay.hide();
    }
    initialize() {
        this.btnClose = this.container.find('.icon[data-id="close"]');
        this.btnClose.on('click', this.close.bind(this));

        this.appOverlay = $('#overlay');

        this.close();
    }
}

class ControlPanel {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new ControlPanel();
        }
        return this.instance;
    }
    onOpenInfo(e) {
        window.open('https://isurfer21.github.io/syncer', '_blank');
    }
    onOpenAbout(e) {
        About.getInstance().modal.open();
    }
    initialize() {
        this.appHeader = $('.window > header.toolbar-header');

        this.appHeaderAbout = this.appHeader.find('.icon[data-link="about"]');
        this.appHeaderAbout.on('click', this.onOpenAbout.bind(this));

        this.appHeaderInfo = this.appHeader.find('.icon[data-link="info"]');
        this.appHeaderInfo.on('click', this.onOpenInfo.bind(this));

        this.currentYear = $('.nc-currentyear');
        let cYear = (new Date()).getFullYear()
        this.currentYear.html((cYear > 2019) ? '-' + cYear : '');
    }
}

class About {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new About();
        }
        return this.instance;
    }
    initialize(containerId) {
        this.modal = new Modal('#' + containerId);
        this.modal.initialize();
    }
}

class Login {
    static instance
    static getInstance() {
        if (!this.instance) {
            this.instance = new Login();
        }
        return this.instance;
    }
    constructor() {
        this.tunnel = new Tunnel();
    }
    onSubmit(e) {
        e.preventDefault();

        let username = this.fieldUsername.val();
        let password = this.fieldPassword.val();

        this.apiKey = this.tunnel.genApiKey(username, password);

        Action.getInstance().ready();
        this.modal.close();
    }
    destroy() {
        this.submit.off('click', this.onSubmit.bind(this));
    }
    initialize(containerId) {
        this.cid = containerId;
        this.container = $('#' + this.cid);

        this.modal = new Modal('#' + this.cid);
        this.modal.initialize();

        this.form = this.container.find('form');

        this.fieldUsername = this.form.find('input[name="username"]');
        this.fieldPassword = this.form.find('input[name="password"]');

        this.feedback = new Feedback(this.form.find('.nc-feedback'));
        this.feedback.initialize();

        this.submit = this.form.find('button[type="submit"]');
        this.submit.on('click', this.onSubmit.bind(this));
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
    let appControlPanel = ControlPanel.getInstance();
    let appAbout = About.getInstance();
    let appLogin = Login.getInstance();

    appSidebar.initialize('appsidebar');
    appSearch.initialize('appsidebar');
    appInputSetting.initialize('appcontainer');
    appInputAction.initialize('appcontainer');
    appOutput.initialize('appcontainer');
    appError.initialize('appcontainer');
    appControlPanel.initialize();
    appAbout.initialize('appabout');
    appLogin.initialize('applogin');
    appLogin.modal.open();

    let appTopbar = Topbar.getInstance();
    appTopbar.initialize('appcontainer');

    let appInputTopbar = InputTopbar.getInstance();
    appInputTopbar.initialize('appcontainer');
});