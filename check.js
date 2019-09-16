class Check {
    constructor() {
        this.keyboard = new Keyboard(this);

        this.id = 0;
        this.rows = 0;
        this.json = {};

        if (!this.getAutoSync()) {
            this.setup();
        }
        this.autoSync = this.getAutoSync().enable;
        this.id = this.uuidv4();
        
        if (this.autoSync) {
            this.id = this.getAutoSync().lastSync;
            this.syncDown(this.id);
            $("#auto-sync").addClass("active");
        }

        this.activeSync();

        // this.db = openDatabase("ftwo_check", "1.0", "Ftwo Check", 5000000);
    }

    setup() {
        this.id = this.uuidv4();

        this.setAutoSync({
            "enable": false,
            "lastSync": this.id
        });

        this.setSync([{
            "id": this.id,
            "title": "",
            "subtitle": "",
            "items": []
        }]);
    }


    activeSync() {
        let $this = this;
        $('#title').blur(function() {
            $this.syncronize();
        });
        
        $('#subtitle').blur(function() {
            $this.syncronize();
        });

        $('.input').blur(function() {
            $this.syncronize();
        });

        $('.input-checkbox').click(function() {
            $this.syncronize();
        });
    }

    addNewRow($this, item) {
        this.rows++;
        let clone;

        if (item) {
            clone = $this.clone();
        } else {
            clone = $this.parent().clone();
        }

        clone = this.updateIndex(clone, item);

        if (item) {
            $(".body .container ul").append(clone);
        } else {
            clone.insertAfter($this.parent());
        }

        clone.find('.input').focus();
        
        this.updateAllIndex();
        this.syncronize();
    }

    removeRow(deleteButton) {
        let row = deleteButton.parent();
        row.remove();
        this.updateAllIndex();
        this.syncronize();
    }

    updateIndex(clone, item) {
        let currentItem = {
            index: this.rows,
            name: "",
            checked: false,
            title: false,
            strong: false
        }
        
        currentItem = item ? item : currentItem;
        
        let input = clone.find(".input");
        let checkbox = clone.find(".checkbox .input-checkbox");
        let label = clone.find(".checkbox .label-checkbox");
        let deleteButton = clone.find(".remove-button");
        
        clone.data("index", currentItem.index);
        clone.attr("data-index", currentItem.index);
        clone.data("title", currentItem.title);
        clone.attr("data-title", currentItem.title);
        clone.data("strong", currentItem.strong);
        clone.attr("data-strong", currentItem.strong);

        input.val(currentItem.name);

        checkbox.prop("id", "checkbox-" + currentItem.index);
        checkbox.prop("checked", currentItem.checked);

        label.prop("for", "checkbox-" + currentItem.index);

        let $this = this;
        input.keyup(function(event) {
            $this.keyboard.keyup(this, event);
        });

        input.keydown(function(event) {
            $this.keyboard.keydown(this, event);
        });

        input.blur(function() {
            $this.syncronize();
        });

        checkbox.click(function() {
            $this.syncronize();
        });
        
        deleteButton.click(function() {
            $this.removeRow($(this));
        });

        return clone;
    }

    updateAllIndex() {
        let $array = $(".line");

        let index = 0;
        for (let i = 0; i < $array.length; i++) {
            let item = $($array[i]);

            item.data("index", index);
            item.attr("data-index", index);
            item.find(".checkbox .input-checkbox").prop("id", "checkbox-" + index);
            item.find(".checkbox .label-checkbox").prop("for", "checkbox-" + index);

            index++;
        }

        this.rows = index;
    }

    syncronize() {
        let $array = $(".line");

        this.json = {
            "id": this.id,
            "title": $("#title").val(),
            "subtitle": $("#subtitle").val(),
            "items": []
        }

        for (let i = 0; i < $array.length; i++) {
            let item = $($array[i]);

            let $item = {
                "index": 0,
                "name": "",
                "checked": false,
                "title": false,
                "strong": false
            }

            $item.index = item.data("index");
            $item.title = item.data("title");
            $item.strong = item.data("strong");
            $item.name = item.find(".input").val();
            $item.checked = item.find(".checkbox .input-checkbox").prop("checked");

            this.json.items.push($item);
        }

        if (this.autoSync) {
            this.syncUp();
        }
    }

    handleAutoSync(input) {
        this.autoSync = this.autoSync ? false : true;

        let autoSync = this.getAutoSync();
        autoSync.enable = this.autoSync;
        autoSync.lastSync = this.id;
        this.setAutoSync(autoSync);

        this.syncronize();
        if (this.autoSync) {
            input.addClass("active");
            return;
        }
        input.removeClass("active");
    }

    getAutoSync() {
        return JSON.parse(localStorage.getItem("autoSync"));
    }

    setAutoSync(autoSync) {
        localStorage.setItem("autoSync", JSON.stringify(autoSync));
    }

    getSync(currentId) {
        let currentSync = JSON.parse(localStorage.getItem("ftwo-check"));
        let specificSync;
        if (currentId) {
            for (let i = 0; i < currentSync.length; i++) {
                let item = currentSync[i];
                if (item.id == currentId) {
                    specificSync = item;
                }
            }
            return specificSync;
        }
        return currentSync;
    }

    setSync(sync) {
        return localStorage.setItem("ftwo-check", JSON.stringify(sync));
    }

    updateSync(sync) {
        let syncs = this.getSync();

        let exists = false;
        let index;
        for (let i = 0; i < syncs.length; i++) {
            if (syncs[i].id == sync.id) {
                index = i;
                exists = true;
            }
        }

        if (exists) {
            syncs[index] = sync;
        } else {
            syncs.push(sync);
        }

        this.setSync(syncs);
    }

    syncUp() {
        this.updateSync(this.json);

        let currentAutoSync = this.getAutoSync();
        currentAutoSync.lastSync = this.id;
        this.setAutoSync(currentAutoSync);
    }

    syncDown(current) {
        let items = [];
        let replace = this.json && this.json.items && this.json.items.length > 0;
        if (typeof current == "object") {
            if (!replace) {
                this.json = current;
            } else {
                this.json.items.concat(current.items);
            }
            items = current.items;
        } else {
            this.json = this.getSync(current);
            items = this.json.items;
        }

        $("#title").val(this.json.title);
        $("#subtitle").val(this.json.subtitle);
        
        for (let  i = 0; i < items.length; i++) {
            let item = items[i];
            let base = $($(".line")[0]);
            
                if (!replace && i == 0) {
                    $(base).data("title", item.title);
                    $(base).data("strong", item.strong);
                    $(base).attr("data-index", item.index);
                    $(base).attr("data-title", item.title);
                    $(base).attr("data-strong", item.strong);
                    $(base).find(".input").val(item.name);
                    $(base).find(".input-checkbox").prop("checked", item.checked);
                    
                    $(base).find(".input-checkbox").prop("id", "checkbox-"+item.index);
                    $(base).find(".label-checkbox").prop("for", "checkbox-"+item.index);
                    continue;
                }

                this.addNewRow(base, item);
            }

        this.id = this.json.id;
    }

    import($json) {
        this.syncDown(JSON.parse($json));
        this.rows = this.json.items.pop().index;
    }

    export() {
        console.log(JSON.stringify(this.json));
    }

    createNew() {
        let autoSync = this.getAutoSync();
        autoSync.lastSync = this.uuidv4();
        this.setAutoSync(autoSync);
        document.location.reload(true);
    }

    reset() {
        this.setup();
        document.location.reload(true);
    }

    help() {
        $('body').modal();
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

class Keyboard {
    constructor(check) {
        this.enter = 13;
        this.ctrl = 17;
        this.alt = 18;
        this.b = 66;
        this.t = 84;

        this.altPressed = false;
        this.ctrlPressed = false;

        this.check = check;

        $('.input').keyup(function(event) {
            check.keyboard.keyup(this, event);
        }); 
    
        $('.input').keydown(function(event) {
            check.keyboard.keydown(this, event);
        });
    
        $(".remove-button").click(function() {
            check.removeRow($(this));
        });
    
        $("#auto-sync").click(function() {
            check.handleAutoSync($(this));
        });
    
        $("#import").click(function() {
            let newJson = prompt("Insira o seu JSON");
    
            if (newJson) {
                check.import(newJson);
            }
        });
    
        $("#export").click(function() {
            check.export();
        });

        $("#new").click(function() {
            check.createNew();
        });

        $("#reset").click(function() {
            check.reset();
        });

        $("#help").click(function() {
            check.help();
        });
    }

    keyup($this, event) {
        if(event.which == this.enter){
            this.check.addNewRow($($this));
        }
    
        if(event.which == this.ctrl){
            this.ctrlPressed = false;
        }
        
        if(event.which == this.alt){
            this.altPressed = false;
        }
        
        if(event.which == this.b && this.ctrlPressed){
            let strong = !$($this).parent().data("strong");

            $($this).parent().data("strong", strong);
            $($this).parent().attr("data-strong", strong);
        }

        if(event.which == this.t && this.altPressed){
            let title = !$($this).parent().data("title");
            
            $($this).parent().data("title", title);
            $($this).parent().attr("data-title", title);
        }
    }

    keydown($this, event) {
        if(event.which == this.ctrl){
            this.ctrlPressed = true;
        }
        
        if(event.which == this.alt){
            this.altPressed = true;
        }
    }
}