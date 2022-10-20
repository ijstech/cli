import Msg from '@dapp/module1';
import {Module, Styles} from '@ijstech/components';
import Assets from '@dapp/assets';

Styles.Theme.applyTheme(Styles.Theme.darkTheme);

export default class MainLauncher extends Module{
    render(){
        return <i-panel>
            <i-image url={Assets.img.network.eth}></i-image><i-button caption={Msg} width={100}></i-button>
        </i-panel>
    };
};