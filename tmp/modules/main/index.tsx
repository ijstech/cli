import { Module, Styles, Container, customModule } from '@ijstech/components';
import Assets from '@dapp/assets';
import styleClass from './index.css';
import { setDataFromSCConfig } from '@dapp/network';
export { Header } from './header';
Styles.Theme.applyTheme(Styles.Theme.darkTheme);

interface IMenuItem {
	caption?: string;
  module: string;
}

@customModule
export default class MainLauncher extends Module {
	private menuItems: any[];
	constructor(parent?: Container, options?: any) {
		super(parent, options);
		this.classList.add(styleClass);
	};
	override initCustomData(options: any) {
		this.menuItems = options.menus || [];
		setDataFromSCConfig(options);
	}
	getBreadcrumbList(): string[] {
		const url = window.location.hash.replace('#/', '');
		return url.split('/').map(v => decodeURIComponent(v.split("?")[0]));
	}
	// getMenus(options?: any) {
	// 	if (!options) return [];
	// 	return options.menus.map((menu: IMenuItem) => {
	// 		let modulePath = menu.module;
	// 		if (options.modules && options.modules[menu.module] && options.modules[menu.module].path) {
	// 			modulePath = "/";
	// 			if (options.moduleDir)
	// 					modulePath += options.moduleDir + '/';
	// 			modulePath += options.modules[menu.module].path;
	// 			if (!modulePath.endsWith('.js'))
	// 					modulePath += '/index.js';
	// 		}
	// 	})
	// }

	// async renderBreadcrumb() {
	// 	if (!this.header || !this.header.breadcrumb) return;
	// 	if (!this.breadcrumbStack) {
	// 		const stackElm: any = { verticalAlignment: "center", gap: "8px" };
	// 		if (this.header.padding) stackElm.padding = this.header.padding;
	// 		this.breadcrumbStack = await HStack.create(stackElm);
	// 		this.breadcrumbStack.classList.add("breadcrumb");
	// 		this.subHeader.appendChild(this.breadcrumbStack);
	// 	}
	// 	this.breadcrumbStack.innerHTML = '';
	// 	if (
	// 		typeof this.header.breadcrumb === 'object' &&
	// 		(!this.header.breadcrumb.supportedUrl.length ||
	// 		!this.header.breadcrumb.supportedUrl.includes(this.currentModuleUrl))
	// 	) {
	// 		this.breadcrumbStack.visible = false;
	// 		return;
	// 	}
	// 	const list = this.getBreadcrumbList();
	// 	let url = '#';
	// 	const breadcrumbs = list.map((path: string, index) => {
	// 		url += '/' + path;
	// 		const color = index === list.length - 1 ? Theme.colors.primary.contrastText : Theme.colors.primary.dark;
	// 		const className = index === list.length - 1 ? "active inline-flex" : "inline-flex";
	// 		return (
	// 			<i-label
	// 				link={{ href: url, target: "_self" }}
	// 				class={className}
	// 				font={{ bold: true, color: color }}
	// 				caption={path}
	// 			>
	// 			</i-label>
	// 		)
	// 	});
	// 	this.breadcrumbStack.visible = true;
	// 	this.breadcrumbStack.append(...breadcrumbs);
	// }
	render() {
		<i-panel>
			<i-stack
				id="mainPanel"
				height="800"
				width="100%"
				position="absolute"
				dock='top'
				zIndex={-10}
			></i-stack>
			<main-header id="header" width="100%" menuItems={this.menuItems}></main-header>
			<i-panel id="footer" width="100%"></i-panel>
		</i-panel>
	};
};