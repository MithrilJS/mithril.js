//Mithril type definitions for Typescript

interface MithrilStatic {
	(selector: string, attributes: Object, children?: any): MithrilVirtualElement;
	(selector: string, children?: any): MithrilVirtualElement;
	prop(value?: any): (value?: any) => any;
	withAttr(property: string, callback: (value: any) => void): (e: Event) => any;
	module(rootElement: Node, module?: MithrilModule): Object;
	trust(html: string): String;
	render(rootElement: Element, children?: any): void;
	render(rootElement: HTMLDocument, children?: any): void;
	redraw: {
		(): void;
		strategy(key: string);
	};
	route: {
		(rootElement:Element, defaultRoute:string, routes:{ [key: string]: MithrilModule }): void
		(element: Element, isInitialized: boolean): void;
		(rootElement:HTMLDocument, defaultRoute:string, routes:{ [key: string]: MithrilModule }): void;
		(path:string, params?:any, shouldReplaceHistory?:boolean): void;
		(): string;
		param(key:string): string;
		mode: string;
	};
	request(options: MithrilXHROptions): MithrilPromise;
	deferred(): MithrilDeferred;
	sync(promises: MithrilPromise[]): MithrilPromise;
	startComputation(): void;
	endComputation(): void;
	deps(Object: any): Object;
}

interface MithrilVirtualElement {
	tag: string;
	attrs: Object;
	children: any;
}

interface MithrilModule {
	controller: Function;
	view: Function;
}

interface MithrilDeferred {
	resolve(value?: any): void;
	reject(value?: any): void;
	promise: MithrilPromise;
}

interface MithrilPromise {
	(value?: any): any;
	then(successCallback?: (value: any) => any, errorCallback?: (value: any) => any): MithrilPromise;
}

interface MithrilXHROptions {
	method: string;
	url: string;
	user?: string;
	password?: string;
	data?: any;
	background?: boolean;
	unwrapSuccess?(data: any): any;
	unwrapError?(data: any): any;
	serialize?(dataToSerialize: any): string;
	deserialize?(dataToDeserialize: string): any;
	extract?(xhr: XMLHttpRequest, options: MithrilXHROptions): string;
	type?(data: Object): void;
	config?(xhr: XMLHttpRequest, options: MithrilXHROptions): XMLHttpRequest;
}

declare var Mithril: MithrilStatic;
declare var m: MithrilStatic;

declare module 'mithril' {
	export = MithrilStatic;
}
