import 'mocha';
import Ganache from "ganache";
import {Wallet} from "@ijstech/eth-wallet";
import Contracts from "../src/index";
import assert from "assert";

describe('##Contracts', function() {
    let accounts: string[];
    let wallet: Wallet;
    before(async ()=>{
        let provider = Ganache.provider({
            logging: {
                logger: {
                    log: () => { }
                }
            }
        });
        wallet = new Wallet(provider);
        accounts = await wallet.accounts;
        console.log(accounts);
        wallet.defaultAccount = accounts[0];
    })
    it('erc20', async function() {
        let erc20 = new Contracts.ERC20(wallet);
        let address = await erc20.deploy();
        console.dir('#deployed ERC20 address: ' + address);
        await erc20.mint(1000);        
        await erc20.transfer({
            recipient: accounts[1],
            amount: 100
        });
        let balance0 = (await erc20.balanceOf(accounts[0])).toNumber()
        let balance1 = (await erc20.balanceOf(accounts[1])).toNumber()
        assert.strictEqual(balance0, 900)
        assert.strictEqual(balance1, 100)
    });
});