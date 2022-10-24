import {Module, Styles, Container, customModule} from '@ijstech/components';
// import Assets from '@dapp/assets';
import styleClass from './index.css';
export {Header} from './header';
Styles.Theme.applyTheme(Styles.Theme.darkTheme);

@customModule
export default class MainLauncher extends Module{
    constructor(parent?: Container, options?: any) {
		super(parent, options);
		this.classList.add(styleClass);
	};
    render(){
        <i-panel>
            <i-stack
                id="mainPanel"
                height="800"
                width="100%"
                position="absolute"
                dock='top'
                zIndex={-10}
            ></i-stack>
            <main-header id="header" width="100%"></main-header>            
            <i-panel id="footer" width="100%"></i-panel>
        </i-panel>
        // return <i-panel>
        //     <i-image url={Assets.img.network.eth}></i-image><i-button caption={Msg} width={100}></i-button>
        // </i-panel>
    };
};