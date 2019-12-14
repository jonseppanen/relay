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

            if (node.nodeType !== 3 && node.querySelectorAll('style').length > 0) {
                let nodeShell = node.cloneNode();
                nodeShell.insertAdjacentHTML('afterbegin', node.querySelectorAll('style')[0].outerHTML.slice(0) + '<slot></slot>');
                node.querySelectorAll('style')[0].remove();
                let shadow = node.attachShadow({ mode: 'open' });
                shadow.innerHTML = nodeShell.outerHTML;
            }

            oldNodes[0].parentNode.insertBefore(node, oldNodes[0].nextSibling)
        });
        this.nodes = newNodes;
        oldNodes.forEach(node => {
            node.remove()
        })
    }
}

export default class Relay {
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
