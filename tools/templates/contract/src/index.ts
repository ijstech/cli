import * as Contracts from './contracts/index';
export {Contracts};
import {IWallet, BigNumber} from '@ijstech/eth-wallet';

export interface IDeployOptions {
    initSupply?: string;
};
export interface IDeployResult {
    erc20: string;
};
var progressHandler: any;
export var DefaultDeployOptions: IDeployOptions = {
    initSupply: '10000'
};
function progress(msg: string){
    if (typeof(progressHandler) == 'function'){
        progressHandler(msg);
    };
}
export async function deploy(wallet: IWallet, options?: IDeployOptions): Promise<IDeployResult>{
    progress('Contracts deployment start');
    let erc20 = new Contracts.ERC20(wallet);
    progress('Deploy ERC20');
    let address = await erc20.deploy();
    progress('ERC20 deployed ' + address)
    if (options && options.initSupply){
        progress('Mint initial supply ' + options.initSupply)
        let value = new BigNumber(options.initSupply);
        let result = await erc20.mint(value);
        progress('Transaction # ' + result.transactionHash);
    };
    progress('Contracts deployment finished');
    return {
        erc20: address
    };
};
export function onProgress(handler: any){
    progressHandler = handler;
};
export default {
    Contracts,
    deploy,
    DefaultDeployOptions,
    onProgress
};