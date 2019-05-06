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
    constructor(container, prefix) {
        this.prefix = prefix
        this.container = $('#' + container);
        this.tabs = this.container.find(this.TAB_ITEM.graft(prefix));
        this.boxes = this.container.find(this.TAB_CONTENT.graft(prefix));
    }
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
    initialize() {
        this.boxes.hide();
        this.tabs.on('click', this.onClickTab.bind(this));
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
    onSubmit(e) {
        e.preventDefault();
        if (this.isEmpty(this.fieldTitle.val())) {
            this.feedback.html('Error: Title field is required').show();
        } else if (this.isEmpty(this.fieldDescription.val())) {
            this.feedback.html('Error: Description field is required').show();
        } else if (this.isEmpty(this.fieldSourcePath.val())) {
            this.feedback.html('Error: SourcePath field is required').show();
        } else if (this.isEmpty(this.fieldGaragePath.val())) {
            this.feedback.html('Error: GaragePath field is required').show();
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
            this.storage.store(this.database);
            Sidebar.getInstance().render();
            Search.getInstance().refresh();
            this.feedback.hide();
        }
    }
    onClear(e) {
        this.editing = false;
        this.tagCtrl.list = [];
        this.tagCtrl.render();
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

        this.feedback = this.form.find('.nc-feedback');
        this.feedback.on('click', (e) => this.feedback.hide());
        this.feedback.hide();

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
    }
    view(index) {
        this.index = index;
        this.database = this.storage.retrieve();
        this.cargo = this.database[index];
        let content = '<p><span><b>[0]</b></span><br><span>[1]</span></p>'.graft(this.cargo.title, this.cargo.description);
        this.instruction.html(content);
    }
    onSubmit(e) {
        e.preventDefault();
        if (!!this.cargo) {
            console.log('onSubmit', this.fieldSyncDirection.val());
        } else {
            this.feedback.html('Error: No item is selected').show();
        }
    }
    initialize(containerId) {
        this.cid = containerId;
        this.container = $('#' + this.cid);
        this.form = this.container.find('form[data-id="action"]');

        this.feedback = this.form.find('.nc-feedback');
        this.feedback.on('click', (e) => this.feedback.hide());
        this.feedback.hide();

        this.instruction = this.form.find('.nc-instruction');

        this.fieldSyncDirection = this.form.find('select[name="syncdirection"]');

        this.submit = this.form.find('button[type="submit"]');
        this.submit.on('click', this.onSubmit.bind(this));
    }
}

$(function() {
    let storage = Storage.getInstance();
    storage.setId('syncer', 'setting');

    let appSidebar = Sidebar.getInstance();
    let appSearch = Search.getInstance();
    let inputSetting = Setting.getInstance();
    let inputAction = Action.getInstance();

    appSidebar.initialize('appsidebar');
    appSearch.initialize('appsidebar');
    inputSetting.initialize('appcontainer');
    inputAction.initialize('appcontainer');

    let appTopbar = new TabController('appcontainer', 'topbar');
    appTopbar.initialize();
    appTopbar.activateTab('input');

    let inputTopbar = new TabController('appcontainer', 'inputtopbar');
    inputTopbar.initialize();
    inputTopbar.activateTab('action');

    let tunnel = new Tunnel();

    let failure = (options, status, error) => {
        console.log('main.failure', status, error);
    };

    function createSession() {
        console.log('createSession');
        tunnel.session((token) => {
            console.log('main.session.success', token);
            executeCommand('ls', token);
        }, failure);
    }

    function executeCommand(command, token) {
        console.log('executeCommand', command, token);
        tunnel.terminal(command, token,
            (result) => {
                console.log('main.terminal.success', result);
            }, failure
        );
    }

    // createSession();
});