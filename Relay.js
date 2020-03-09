/**
 * Relay Component
 * Example use: Component('path/to/html/file', argument1, argument2...)
 *
 * @param {*} templateHTML Path to the template file. This is a plain html file that compiles to a template literal.
 *     Components loaded by Relay will have their styling automatically scoped using shadow dom, so you don't
 *     need an external module for this. You can pass arguments to use in this css with templateArgs.
 * @param  {...any} templateArgs Arguments to pass to the HTML as template literal values. If there is more than
 *     one argument they will be automatically sent as an array, which can be referred to as ${this[n]}.
 *     If there is only argument, it will be sent as ${this}. In which case, you can send an array to refer to with
 *     ${this[n]} or key lookup with ${this.key} or ${this["key"]}.
 *     IMPORTANT: If you wish to use/watch Relay values, don't overthink it. Just use a bigote {{with.a.dot.path}}
 */
export async function Component(templateHTML, ...templateArgs) {
    let response = await fetch(`./templates/${templateHTML}`);
    return await new Function("return `" + await response.text() + "`;").call((templateArgs.length > 1) ? templateArgs : templateArgs[0]);
}

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

    shadowDomify = (node) => {
        let nodeShell = node.cloneNode();
        nodeShell.insertAdjacentHTML('afterbegin', node.querySelectorAll('style')[0].outerHTML.slice(0) + '<slot></slot>');
        node.querySelectorAll('style')[0].remove();
        let shadow = node.attachShadow({ mode: 'open' });
        shadow.innerHTML = nodeShell.outerHTML;
        return node;
    }

    update = () => {

        this.watched = this.dotPath ? [this.dotPath] : [];
        let workNode = document.createElement('div');

        let templateSource = this.dotPath && this.dotPath.split('.').reduce((o, i) => o ? o[i] : null, this.relay.data);

        if (Array.isArray(templateSource)) {
            templateSource.forEach((template, iteration) => {
                workNode.insertAdjacentHTML('beforeend', this.relay.inject(template.slice(0), [(this.watched + '.' + iteration)], this.relay));
            })
        }
        else {
            let template = this.relay.inject((this.template || (templateSource || '')).slice(0), this.watched, this.relay);
            workNode.insertAdjacentHTML('beforeend', template);
        }

        workNode.querySelectorAll('.RelayTarget').forEach(newSpark => this.relay.register([newSpark]))

       // let newNodes = Array.from(workNode.childNodes);

        let newNodes = Array.from(workNode.childNodes).reverse().map((node, index) => (node.nodeType !== 3 && node.querySelectorAll('style').length > 0) ? this.shadowDomify(node) : node);

        let parentDom = this.nodes[0].parentNode;
/*
        newNodes.forEach((newNode, index) => {
            if(this.nodes[index]){
                this.nodes[index] = newNode;
            }
            else{
                this.nodes.push(newNode);
            }
        })*/

        


     /*   newNodes.forEach((node, index) => {
            if (node.nodeType !== 3 && node.querySelectorAll('style').length > 0) this.shadowDomify(node)
        })*/


        //console.log(this.nodes);
        //console.log(newNodes);
       // console.log(parentDom);

        newNodes.forEach((node, index) => {
            this.nodes[0].parentNode.insertBefore(node, this.nodes[0].nextSibling)
        });

        this.nodes.forEach(node => {
            node.remove()
        })

        this.nodes = newNodes;
    }
}

export class Relay {
    register = (nodes) => {
        const sNode = new Spark(nodes, this);
        this.registry.push(sNode);
        return sNode.nodes;
    }

    getDotPath = (target, property = null) => {
        let pathString = ''
        let ancestor = this.ancestry.get(target);
        if (!ancestor) return property;
        while (ancestor.keyname) {
            pathString += ancestor.keyname;
            ancestor = ancestor.parent;
        }
        property !== null && (pathString += '.' + property);
        return pathString
    }

    inject = (template, watcher) => {
        const bigote = /\{\{([^\{\{\}\}]+)\}\}/g;

        if (Array.isArray(template)) {
            console.log(template);
            template = template.join('');

        }
        return template.slice(0).replace(bigote, (match, variable) => {
            let value = variable.split('.').reduce((o, i) => o && o[i], this.data) || '';
            if (!value) {
                if (!watcher.includes(variable)) watcher.push(variable); return '';
            }

            if (!value.includes("{{") && !value.includes("<")) {
                if (!watcher.includes(variable)) watcher.push(variable);
                return value
            }

            return '<span class="RelayTarget" data-value="' + variable + '" style="display:none;"></span>';
        });
    }



    relayProxy = {
        set: async (target, property, value) => {

            if (Promise.resolve(value) == value) {
                value = (await value);
            }
            if (Array.isArray(value)) {
                value = (await Promise.all(value));
            }

            if (JSON.stringify(target[property]) === JSON.stringify(value)) return true;

            if (Array.isArray(value) || (typeof value === "object")) {
                this.ancestry.set(value, { parent: target, keyname: property });
                target[property] = new Proxy(value, this.relayProxy)
            }
            else {
                target[property] = value;
            }

            if (Array.isArray(target)) {

                this.registry.filter(sNode => sNode.watched.includes(this.getDotPath(target))).forEach(sNode => sNode.update());

            }
            else {
                this.registry.filter(sNode => sNode.watched.includes(this.getDotPath(target, property))).forEach(sNode => sNode.update());
            }
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

export default Relay;