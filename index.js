


/*
const templateOuterHTML = (node) => {
    let domfrag = document.createDocumentFragment();
    let shellWorker = document.createElement('div');
    domfrag.appendChild(shellWorker);
    let outerShell = node.cloneNode();
    shellWorker.innerHTML = outerShell.outerHTML.slice(0).replace(bigote, (match, variable) => variable.split('.').reduce((o, i) => o[i], R) || '');
    return shellWorker.firstElementChild;
}*/


class Spark {
    constructor(node, relay) {
        this.node = node;
        this.relay = relay;
        this.template = node.cloneNode(true);
        this.watched = [];
        this.update();
    }

    bigote = /\{\{([^\{\{\}\}]+)\}\}/g;

    splitter = (htmlString) => {
        let domfrag = document.createDocumentFragment();
        let newNode = document.createElement('div');
        domfrag.appendChild(newNode);
        newNode.innerHTML = htmlString;
        let newString = '';
        for (let child of newNode.childNodes) {
            if (child.nodeValue) {
                if (child.nodeValue.includes('{{')) {
                    newString += child.nodeValue.slice(0).replace(this.bigote, (match, variable) => {
                        let value = variable.split('.').reduce((o, i) => o[i], R) || '';
                        if (value.includes("<")) {
                            return this.splitter(value);
                        }
                        else {
                            return value;
                        }
                    });
                }
                else {
                    newString += child.nodeValue;
                }
            }
            else {
                if (child.outerHTML.includes('{{')) {
                    newString += '<span class="RelayTarget">' + child.outerHTML.slice(0) + '</span>';
                }
                else {
                    newString += child.outerHTML;
                }
            }
        }

        return newString;

    }

    usurp = (replaced, replacer) => {
        replaced.parentNode.insertBefore(replacer, replaced.nextSibling);
        replaced.remove();
        return replacer;
    }

    update = () => {

        let domfrag = document.createDocumentFragment();
        let workNode = document.createElement('div');
        domfrag.appendChild(workNode);
        workNode.innerHTML = this.template.outerHTML.slice(0).replace(this.bigote, (match, variable) => {

            if (!this.watched.includes(variable)) this.watched.push(variable);
            let value = variable.split('.').reduce((o, i) => o && o[i], this.relay.rootProxy) || '';
            if (value.includes("<") || value.includes("{{")) {
                return this.splitter(value);
            }
            else {
                return value;
            }

        });

        let newNode = workNode.firstElementChild;

        for (let newSpark of newNode.querySelectorAll('.RelayTarget')) {
            this.usurp(newSpark, this.relay.register(newSpark.firstChild))
        }

        this.node = this.usurp(this.node, newNode)
    }


}

class Relay {
    register = (el) => {
        const sNode = new Spark(el, this);
        this.registry.push(sNode);
        return sNode.node;
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

    updateWatchers = (target, property) => {
        this.registry.filter(sNode => sNode.watched.includes(this.getDotPath(target, property))).forEach(sNode => sNode.update());
        this.registry = this.registry.filter(sNode => document.getElementById("Relay").contains(sNode.node));
        console.log(this.registry);
    }

    relayProxy = {
        set: (target, property, value) => {
            target[property] = (Array.isArray(value) || typeof value === "object") ? () => { this.ancestry.set(value, { parent: target, keyname: property }); return new Proxy(value, this.relayProxy) } : value;
            this.updateWatchers(target, property);
            return true;
        }
    };

    constructor(rootElement) {
        this.ancestry = new WeakMap();
        this.rootElement = rootElement;
        this.registry = [new Spark(this.rootElement, this)];
        this.rootProxy = new Proxy({}, this.relayProxy);
        return this.rootProxy;
    }
}

const R = new Relay(document.getElementById("Relay"))

R.deep = {}
R.deep.shit = "gg"
R.anchor1 = 'prestring<div>anchor1{{deepclass}}</div>'
R.anchor2 = 'anchor2<div>{{deep.shit}}</div>'
R.anchor3 = '<div><h2>anchor3{{deepclass}}</h2></div>'
R.anchor4 = '<div>anchor4{{deepclass}}</div>'
R.anchor5 = '<div>anchor5</div>'
R.anchor6 = '<div>anchor6</div>'
R.anchor7 = '<div>anchor7{{deep.shit}}</div>'
R.deepclass = 'fucky'
R.class1 = 'notfucky'

const gg = () => {
    R.deepclass = 'hnggggggg'
}



