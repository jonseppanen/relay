class Spark {
    constructor(nodes, relay) {
        this.nodes = nodes;
        this.relay = relay;
        if (nodes[0].classList && nodes[0].classList.contains('RelayTarget')) {
            this.dotPath = nodes[0].getAttribute('data-value');
        }
        else {
            this.template = nodes.map(node => (node.outerHTML || node.nodeValue)).join();
        }
        this.watched = this.dotPath ? [this.dotPath] : [];
        this.update();
    }

    update = () => {
        this.watched = this.dotPath ? [this.dotPath] : [];
        let workNode = document.createElement('div');
        let template = this.relay.inject((this.template || (this.dotPath.split('.').reduce((o, i) => o && o[i], this.relay.data) || '')).slice(0), this.watched, this.relay);
        workNode.insertAdjacentHTML('afterbegin', template);
        workNode.querySelectorAll('.RelayTarget').forEach(newSpark => this.relay.register([newSpark]))

        let oldNodes = this.nodes;
        let newNodes = Array.from(workNode.childNodes).reverse();
        newNodes.forEach(node => {
            if(node.nodeType !== 3 && node.querySelectorAll('style').length > 0){
                let shadow = node.attachShadow({ mode: 'open' });
                while (node.firstChild) shadow.appendChild(node.firstChild); 
            }
            oldNodes[0].parentNode.insertBefore(node, oldNodes[0].nextSibling)
        });
        this.nodes = newNodes;
        oldNodes.forEach(node => node.remove())
    }
}
class Relay {
    register = (nodes) => {
        const sNode = new Spark(nodes, this);
        this.registry.push(sNode);
        return sNode.nodes;
    }

    getDotPath = (target, property) => {
        let pathString = ''
        let ancestor = this.ancestry.get(target);
        if (!ancestor) return property;
        while (ancestor.keyname) {
            pathString += ancestor.keyname + '.';
            ancestor = ancestor.parent;
        }
        pathString += property;
        return pathString
    }

    inject = (template, watcher) => {
        const bigote = /\{\{([^\{\{\}\}]+)\}\}/g;
        return template.slice(0).replace(bigote, (match, variable) => {
            let value = variable.split('.').reduce((o, i) => o && o[i], this.data) || '';

            if (!value) {
                if (!watcher.includes(variable)) watcher.push(variable); return '';
            }

            if (!value.includes("{{") && !value.includes("<")) {
                if (!watcher.includes(variable)) watcher.push(variable);
                return value
            }

            return '<script class="RelayTarget" data-value="' + variable + '" style="display:none;"></script>';
        });
    }

    relayProxy = {
        set: (target, property, value) => {
            if (JSON.stringify(target[property]) === JSON.stringify(value)) return false;
            target[property] = (Array.isArray(value) || typeof value === "object") ? () => { this.ancestry.set(value, { parent: target, keyname: property }); return new Proxy(value, this.relayProxy) } : value;
            this.registry.filter(sNode => sNode.watched.includes(this.getDotPath(target, property))).forEach(sNode => sNode.update());
            this.registry = this.registry.filter(sNode => this.rootElement.contains(sNode.nodes[0]));
            return true;
        }
    };

    constructor(rootElement) {
        this.ancestry = new WeakMap();
        this.rootElement = rootElement;
        this.registry = [];
        this.data = new Proxy({}, this.relayProxy);

        rootElement.childNodes.forEach(node => {
            let nodeContent = (node.outerHTML || node.nodeValue).slice(0)
            if (nodeContent.includes('{{')) {
                this.register([node])
            }
        })

        return this.data;
    }
}

const R = new Relay(document.getElementById("Relay"))

R.deep = {}
R.deep.shit = "gg"
R.anchor1 = 'prestring<div>anchor1{{deepclass}}</div>'
R.anchor2 = 'anchor2<div>{{deep.shit}}</div>'
R.anchor3 = '<div><h2>anchor3{{deepclass}}</h2></div>'
R.anchor4 = '<div>anchor4{{deepclass}}</div>'
R.anchor5 = '<div>anchor5{{newdeeptest}}</div>'
R.anchor6 = '<div>anchor6</div>'
R.anchor7 = '<div>anchor7{{deep.shit}}</div>'
R.deepclass = 'fucky'
R.class1 = 'notfucky'
R.newdeeptest = '<div>cascade{{newdeeptest2}}</div>'
R.newdeeptest2 = ' to here'

const gg = () => {
    R.deepclass = 'hnggggggg';
    R.anchor5 = `<div>
    <style>
        div{
            background:#0F0;
        }
        .testspan{
            color:#00F;
        }
    </style>
    <div>This is testing shadow root <span class='testspan'>with a test span</span> {{anchor7}}</div></div>
    `
}

const gg2 = () => {
    R.deepclass = 'hnggggggg';
    R.anchor5 = `<div>shadowgone!</div>`
}



