import {
  customElements,
  Module,
  Control,
  ControlElement,
  Menu,
  Styles,
  Button,
  Modal,
  observable,
  Label,
  application,
  IEventBus,
  Panel,
  HStack,
  Icon,
  VStack,
  GridLayout,
  Container
} from '@ijstech/components';
import {IWallet, Wallet, WalletPlugin, WalletPluginConfig } from "@ijstech/eth-wallet";
import { INetwork, EventId, formatNumber } from '@dapp/network';
import styleClass from './header.css';
import Assets from '@dapp/assets';
import {
  walletList,
  connectWallet,
  logoutWallet,
  switchNetwork,
  hasWallet,
  getNetworkInfo,
  getNetworkList,
  getWalletProvider,
  getDefaultChainId,
  NativeTokenByChainId,
  viewOnExplorerByAddress,
  getNetworkType
} from '@dapp/network';

const Theme = Styles.Theme.ThemeVars;
let href = '';

@customElements('main-header')
export class Header extends Module {
    private mobileMenu: Menu;
    private hamburger: Button;
    private switchModal: Modal;
    private connectModal: Modal;
    private accountModal: Modal;
    private wallet: IWallet;
    private lbTokenSymbol: Label;
    private walletContainer: Control;
    private networkButtonContainer: Panel;
    private walletBalanceElm: HStack;
    private lblBalance: Label;
    private walletDetailPanel: Panel;
    private walletDetailButton: Button;
    private walletConnectButton: Button;
    private networkButton: Button;
    private networkGroup: GridLayout;
    private walletListElm: GridLayout;
    // private backBtn: Button;
    private $eventBus: IEventBus;
    private selectedNetwork: INetwork;
    private noteNetworkLabel: Label;
    private mobileStack: Panel;
    private menuStack: Panel;
    private hsCopy: HStack;
    private hsViewAccount: HStack;
    private lblViewAccount: Label;

    @observable()
    private walletShortlyAddress: string;
    @observable()
    private walletInfo = {
        address: '',
        balance: '',
        networkId: 0
    }

    constructor(parent?: Container, options?: any) {
        super(parent, options);
        this.$eventBus = application.EventBus;
        this.registerEvent();    
    };
    get shortlyAddress(): string {
        const address = this.walletInfo.address;
        if (!address) return 'No address selected';
        return address.substr(0, 6) + '...' + address.substr(-4);
    }

    // set canBack(value: boolean) {
    //     this.backBtn.visible = value;
    // }

    registerEvent() {
      let wallet = Wallet.getInstance();
      this.$eventBus.register(this, EventId.ConnectWallet, this.openConnectModal)
      this.$eventBus.register(this, EventId.IsWalletConnected, async (connected: boolean) => {
        if (connected) {
          this.walletInfo.address = wallet.address;
          this.walletInfo.balance = formatNumber((await wallet.balance).toFixed(), 2);
          this.walletInfo.networkId = wallet.chainId;
        }
        this.selectedNetwork = getNetworkInfo(wallet.chainId);
        this.updateConnectedStatus(connected);
        this.updateList(connected);
      })
      this.$eventBus.register(this, EventId.IsWalletDisconnected, async (connected: boolean) => {
        this.selectedNetwork = getNetworkInfo(wallet.chainId);
        this.updateConnectedStatus(connected);
        this.updateList(connected);
      })
      this.$eventBus.register(this, EventId.chainChanged, async (chainId: number) => {
        this.onChainChanged(chainId);
      })
    }

    updateList(connected: boolean) {
      if (connected) {
        this.noteNetworkLabel.caption = getWalletProvider() === WalletPlugin.MetaMask ?
          'We support the following networks, please click to connect.' :
          'We support the following networks, please switch network in the connected wallet.'
      } else {
        this.noteNetworkLabel.caption = 'We support the following networks, please click to connect.';
      }
      this.updateDot(this.networkGroup, connected, 'network');
      this.updateDot(this.walletListElm, connected, 'wallet');
    }

    updateDot(parent: HTMLElement, connected: boolean, type: 'network' | 'wallet') {
      const acivedElm = parent.querySelector('.is-actived');
      acivedElm && acivedElm.classList.remove('is-actived');
  
      if (connected) {
        const wallet = Wallet.getInstance();
        const connectingVal = type === 'network' ? wallet.chainId : wallet.clientSideProvider?.walletPlugin;
        const connectingElm = parent.querySelector(`[data-key="${connectingVal}"]`);
        connectingElm && connectingElm.classList.add('is-actived');
      }
    }

    onChainChanged = async (chainId: number) => {
      this.walletInfo.networkId = chainId;
      this.selectedNetwork = getNetworkInfo(chainId);
      let wallet = Wallet.getInstance();
      const isConnected = wallet.isConnected;
      this.walletInfo.balance = isConnected ? formatNumber((await wallet.balance).toFixed(), 2) : '0';
      this.updateConnectedStatus(isConnected);
      this.updateList(isConnected);
      if (!isConnected) {
        const acivedElm = this.networkGroup.querySelector('.is-actived');
        acivedElm && acivedElm.classList.remove('is-actived');
        const connectingElm = this.networkGroup.querySelector(`[data-key="${chainId}"]`);
        connectingElm && connectingElm.classList.add('is-actived');
      }
    };

    updateConnectedStatus = (value: boolean) => {
        if (value) {
            this.renderNetworkButton();
            if (this.walletContainer.contains(this.walletBalanceElm)) {
                this.walletContainer.removeChild(this.walletBalanceElm);
            }
            this.lblBalance.caption = this.walletInfo.balance;
            this.lbTokenSymbol.caption = this.getSymbol();
            this.walletContainer.appendChild(this.walletBalanceElm);
            this.walletContainer.insertBefore(this.walletBalanceElm, this.walletDetailPanel); 
            if (this.walletContainer.contains(this.walletConnectButton)) {
                this.walletContainer.removeChild(this.walletConnectButton);
            }
            this.walletDetailButton.caption = this.shortlyAddress;
            this.walletShortlyAddress = this.shortlyAddress;
            this.walletDetailPanel.append(this.walletDetailButton);
            const networkType = getNetworkType(Wallet.getInstance().chainId);
            this.lblViewAccount.caption = `View on ${networkType}`;
            this.hsViewAccount.visible = networkType !== 'Unknown';
        }
        else {
            if (this.walletContainer.contains(this.walletBalanceElm)) {
                this.walletContainer.removeChild(this.walletBalanceElm)
            }
            if (this.walletDetailPanel.contains(this.walletDetailButton)) {
                this.walletDetailPanel.removeChild(this.walletDetailButton);
            }
            this.walletContainer.append(this.walletConnectButton);
            this.hsViewAccount.visible = false;
        }
    }

    async requestAccounts() {
        try {
            // await this.wallet.web3.eth.requestAccounts();
        } catch (error) {
            console.error(error);
        }
    }

    async initData() {
        let accountsChangedEventHandler = async (account: string) => {
        }
        let chainChangedEventHandler = async (hexChainId: number) => {
            this.updateConnectedStatus(true);
        }
        const selectedProvider = localStorage.getItem('walletProvider') as WalletPlugin;
        const isValidProvider = Object.values(WalletPlugin).includes(selectedProvider);
        if (hasWallet() && isValidProvider) {
            this.wallet = await connectWallet(selectedProvider, {
                'accountsChanged': accountsChangedEventHandler,
                'chainChanged': chainChangedEventHandler
              });
          }
    }

    toggleMenu() {
        const shownMenu = this.mobileMenu.classList.contains('show-menu');
        shownMenu ? this.mobileMenu.classList.remove('show-menu') : this.mobileMenu.classList.add('show-menu');
    }

    showModal(name: string, title: string = '') {
        const modalELm = this[name as 'switchModal' | 'connectModal' | 'accountModal'];
        title && (modalELm.title = title);
        modalELm.visible = true;
    }

    isLive(walletPlugin: WalletPlugin) {
        return Wallet.isInstalled(walletPlugin)
    }

    isNetworkLive(chainId: number) {
        return Wallet.getInstance().chainId === chainId;
    }

    async switchNetwork(chainId: number) {
      if (!chainId) return;
      await switchNetwork(chainId);
      this.switchModal.visible = false;
    }

    openLink(link: any) {
        return window.open(link, '_blank');
    };
    async connectToProviderFunc(walletPlugin: WalletPlugin) {
      if (Wallet.isInstalled(walletPlugin)) {
          await connectWallet(walletPlugin);
      }
      else {      
          let config = WalletPluginConfig[walletPlugin];
          let homepage = config && config.homepage ? config.homepage() : '';
          this.openLink(homepage);
      }
      this.connectModal.visible = false;
    };

    logout = async() => {
        await logoutWallet();
        this.updateConnectedStatus(false);
        this.updateList(false);
    }

    private getSymbol() {
        let symbol = '';
        if (this.selectedNetwork?.chainId && NativeTokenByChainId[this.selectedNetwork?.chainId]) {
            symbol = NativeTokenByChainId[this.selectedNetwork?.chainId]?.symbol;
        }
        return symbol;
    }
  
    viewOnExplorerByAddress() {
      viewOnExplorerByAddress(Wallet.getInstance().chainId, this.walletInfo.address)
    }
    
    async renderWalletBalance() {
        this.walletBalanceElm = await HStack.create({
          horizontalAlignment: 'center',
          verticalAlignment: 'center',
          background: {color: '#192046'},
          lineHeight: '25px',
          border: {radius: 6},
          padding: {top: 6, bottom: 6, left: 10, right: 10}
        });

        this.lblBalance = await Label.create({
          caption: this.walletInfo.balance,
          font: {color: Theme.text.secondary}
        });
        this.walletBalanceElm.appendChild(this.lblBalance);

        this.lbTokenSymbol = await Label.create({
          caption: this.getSymbol(),
          margin: { left: 5 },
          font: {color: Theme.text.secondary}
        });
        this.lbTokenSymbol.id = "lbTokenSymbol";
        this.walletBalanceElm.appendChild(this.lbTokenSymbol);
    }

    async renderWalletButton() {
      this.walletDetailButton = await Button.create({
        caption: this.shortlyAddress,
        padding: { top: '0.5rem', bottom: '0.5rem', left: '0.75rem', right: '0.75rem' },
        margin: { left: '0.5rem' },
        border: {radius: 5},
        font: {color: Theme.text.secondary},
        background: {color: Theme.colors.error.light}
      })
      const modalElm = await Modal.create({
        showBackdrop: false,
        height: 'auto',
        popupPlacement: 'bottomRight',
        maxWidth: 200,
        minWidth: 200,
        background: {color: '#252a48'}
      })

      const vstack = await VStack.create({
        gap: '15px',
        padding: {top: 10, left: 10, right: 10, bottom: 10}
      });
      const itemCaptions = ["Account", "Switch wallet", "Logout"];
      const itemFunctions = [
        () => this.showModal('accountModal'),
        () => this.showModal('connectModal', 'Switch wallet'),
        this.logout
      ];

      itemCaptions.forEach(async (caption, i) => {
        const buttonItem = await Button.create({
          caption,
          width: '100%',
          height: 'auto',
          border: {radius: 5},
          font: {color: Theme.text.secondary},
          background: {color: 'transparent linear-gradient(90deg, #8C5AFF 0%, #442391 100%) 0% 0% no-repeat padding-box'},
          padding: {top: '0.5rem', bottom: '0.5rem'}
        });
        buttonItem._handleClick = (event: Event): boolean => {
          event.stopPropagation();
          modalElm.visible = false;
          itemFunctions[i]();
          return true;
        }
        vstack.appendChild(buttonItem);
      });
      modalElm.item = vstack;

      this.walletDetailPanel.appendChild(modalElm);
      this.walletDetailButton.onClick = () => modalElm.visible = !modalElm.visible;
  
      this.walletConnectButton = await Button.create({
        caption: "Connect Wallet",
        border: {radius: 5},
        font: {color: Theme.text.secondary},
        padding: {top: '.375rem', bottom: '.375rem', left: '.5rem', right: '.5rem'},
        margin: {left: '0.5rem'}
      })
      this.walletConnectButton.onClick = this.openConnectModal;
      this.walletContainer.append(this.walletConnectButton);
    }

    async renderNetworkButton() {
        if (this.networkButtonContainer.contains(this.networkButton)) {
            this.networkButtonContainer.removeChild(this.networkButton);
        }
        this.networkButton = await Button.create({
          margin: {right: '1rem'},
          padding: {top: '0.375rem', bottom: '0.375rem', left: '0.75rem', right: '0.75rem'},
          background: {color: '#101026'},
          border: {width: '1px', style: 'solid', color: '#101026', radius: 5},
          font: {color: Theme.text.secondary}
        });
        this.networkButton.classList.add('btn-network');
        this.networkButton.onClick = () => this.showModal('switchModal');
        const row = await HStack.create({
          verticalAlignment: 'center',
        });
        const label = await Label.create({
          font: {color: Theme.text.secondary}
        });
        if (this.selectedNetwork) {
            label.caption = this.selectedNetwork.name;
        }
        else {
            label.caption = 'Unsupported Network';
        }
        row.appendChild(label);
        this.networkButton.appendChild(row);
        this.networkButtonContainer.appendChild(this.networkButton);
    }
    renderNetworks() {
      this.networkGroup.clearInnerHTML();
      const networksList = getNetworkList();
      this.networkGroup.append(...networksList.map((network, index) => {
        const img = network.img ? <i-image url={Assets.fullPath(`img/${network.img}`)} width={34} height={34} /> : [];
        return (
          <i-hstack
            onClick={() => this.switchNetwork(network.chainId)}
            background={{color: Theme.colors.secondary.light}}
            border={{radius: 10}} position="relative"
            margin={{top: index === 0 ? 0 : '0.5rem'}}
            class="list-item"
            data-key={network.chainId}
            padding={{top: '0.65rem', bottom: '0.65rem', left: '0.5rem', right: '0.5rem'}}
          >
            <i-hstack margin={{left: '1rem'}} verticalAlignment="center" gap={12}>
              {img}
              <i-label caption={network.name} wordBreak="break-word" font={{size: '.875rem', bold: true, color: Theme.colors.primary.dark}} />
            </i-hstack>
          </i-hstack>
        )
      }));
    }

    openConnectModal = () => {
        this.showModal('connectModal', 'Connect wallet');
    }

    onSwitchScene(source: Control) {
      const back = source.id === "backBtn"
      this.$eventBus.dispatch(EventId.SwitchScene, { source: this, back })
    }
    controlMenuDisplay() {
      if (window.innerWidth <= 1280) {
        // if (this.mobileStack)
        //   this.mobileStack.visible = true;
        // if (this.menuStack)
        //   this.menuStack.background.color = Theme.colors.primary.dark;
      }
      else {
        // if (this.mobileStack)
        //   this.mobileStack.visible = false;
        // if (this.menuStack)
        //   this.menuStack.background.color = 'transparent';
      }
    }

    async init() {
        document.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!this.mobileMenu || !this.hamburger) return;
            if (!this.mobileMenu.contains(e.target as HTMLElement) && (!this.hamburger.contains(e.target as HTMLElement))) {
                this.mobileMenu.classList.remove('show-menu')
            }
        });
        this.classList.add(styleClass);
        this.selectedNetwork = getNetworkInfo(getDefaultChainId());
        this.controlMenuDisplay();
        super.init();
        await this.renderWalletBalance();
        await this.renderWalletButton();
        await this.renderNetworkButton();
        this.renderNetworks();
        this.walletShortlyAddress = this.shortlyAddress;
        await this.initData();
        this.getSymbol();
        this.hsCopy.onClick = () => application.copyToClipboard(this.walletInfo.address || '')
    }
    async render() {
        return (
          <i-panel>
            <i-hstack
              id='menuStack'
              verticalAlignment="center"
              height={80}
              padding={{
                top: '0.2rem',
                bottom: '0.2rem',
                left: '1rem',
                right: '1rem',
              }}
              mediaQueries={[
                {
                  maxWidth: '767px',
                  properties: { height: 56 }
                },
                {
                  minWidth: '768px',
                  maxWidth: '1280px',
                  properties: { height: 70 }
                }
              ]}
            >
              <i-hstack
                verticalAlignment='center'
                horizontalAlignment='space-between'
                width='100%'
                height='100%'
              >
                <i-hstack
                  verticalAlignment='center'
                  maxWidth='calc(100% - 640px)'
                >
                  <i-hstack verticalAlignment='center'>
                    <i-label
                      class='pointer'
                      caption='Logo'
                      font={{ size: '1.25rem', bold: true, color: Theme.text.secondary }}
                      onClick={this.onSwitchScene.bind(this)}
                    ></i-label>
                  </i-hstack>
                </i-hstack>
                <i-hstack verticalAlignment='center' horizontalAlignment='end'>
                  <i-hstack id='walletContainer' margin={{ right: '0.5rem' }}>
                    <i-panel id='networkButtonContainer'></i-panel>
                    <i-panel id='walletDetailPanel'></i-panel>
                  </i-hstack>
                  <i-hstack id='mobileStack' visible={false}>
                    <i-icon
                      width={24}
                      height={24}
                      image={{ url: Assets.fullPath('img/menu/hamburger.svg') }}
                      class='pointer'
                    ></i-icon>
                  </i-hstack>
                </i-hstack>
              </i-hstack>
            </i-hstack>

            <i-modal
              id='switchModal'
              title='Supported Network'
              class='os-modal'
              width={440}
              closeIcon={{ name: 'times' }}
              border={{radius: 10}}
            >
              <i-vstack
                height='100%' lineHeight={1.5}
                padding={{ left: '1rem', right: '1rem', bottom: '2rem' }}
              >
                <i-label
                  id='noteNetworkLabel'
                  margin={{ top: '1rem' }}
                  font={{size: '.875rem'}}
                  wordBreak="break-word"
                  caption='We support the following networks, please click to connect.'
                ></i-label>
                <i-hstack
                  margin={{ left: '-1.25rem', right: '-1.25rem' }}
                  height='100%'
                >
                  <i-grid-layout
                    id='networkGroup'
                    font={{color: '#f05e61'}}
                    height="calc(100% - 160px)" width="100%"
                    overflow={{y: 'auto'}}
                    margin={{top: '1.5rem'}}
                    padding={{left: '1.25rem', right: '1.25rem'}}
                    columnsPerRow={1}
                    templateRows={['max-content']}
                    class='list-view'
                  ></i-grid-layout>
                </i-hstack>
              </i-vstack>
            </i-modal>

            <i-modal
              id='connectModal'
              title='Connect Wallet'
              class='os-modal'
              width={440}
              closeIcon={{ name: 'times' }}
              border={{radius: 10}}
            >
              <i-vstack padding={{ left: '1rem', right: '1rem', bottom: '2rem' }} lineHeight={1.5}>
                <i-label
                  font={{size: '.875rem'}}
                  caption='Recommended wallet for Chrome'
                  margin={{ top: '1rem' }}
                  wordBreak="break-word"
                ></i-label>
                <i-panel>
                  <i-grid-layout
                    id='walletListElm'
                    class='list-view'
                    margin={{top: '0.5rem'}}
                    columnsPerRow={1}
                    templateRows={['max-content']}
                  >
                    {walletList.map((wallet, index) => {
                      return (
                        <i-hstack
                          onClick={() =>
                            this.connectToProviderFunc(wallet.name)
                          }
                          class='list-item'
                          data-key={wallet.name}
                          verticalAlignment='center'
                          gap={12}
                          background={{color: Theme.colors.secondary.light}}
                          border={{radius: 10}} position="relative"
                          margin={{top: index === 0 ? 0 : '0.5rem'}}
                          padding={{top: '0.5rem', bottom: '0.5rem', left: '0.5rem', right: '0.5rem'}}
                          horizontalAlignment="space-between"
                        >
                          <i-label
                            caption={wallet.displayName}
                            margin={{ left: '1rem' }} wordBreak="break-word"
                            font={{size: '.875rem', bold: true, color: Theme.colors.primary.dark}}
                          />
                          <i-image
                            url={Assets.fullPath(
                              `img/wallet/${wallet.iconFile}`
                            )}
                            width={34} height="auto"
                          />
                        </i-hstack>
                      )
                    })}
                  </i-grid-layout>
                </i-panel>
              </i-vstack>
            </i-modal>

            <i-modal
              id='accountModal'
              title='Account'
              class='os-modal'
              width={440}
              height={200}
              closeIcon={{ name: 'times' }}
              border={{radius: 10}}
            >
              <i-panel padding={{left: '1rem', right: '1rem', bottom: '2rem', top: '1rem'}} lineHeight={1.5}>
                <i-hstack
                  horizontalAlignment='space-between'
                  margin={{ top: '1rem' }}
                >
                  <i-label
                    font={{size: '.875rem'}}
                    caption='Connected with'
                  />
                  <i-button
                    caption='Logout'
                    font={{color: Theme.text.secondary}}
                    background={{color: Theme.colors.error.light}}
                    padding={{ top: 6, bottom: 6, left: 10, right: 10 }}
                    border={{radius: 5}}
                    onClick={this.logout}
                  />
                </i-hstack>
                <i-label
                  caption={this.walletShortlyAddress}
                  font={{size: '1.25rem', bold: true, color: Theme.colors.primary.main}}
                  lineHeight={1.5}
                />
                <i-hstack verticalAlignment="center" gap="2.5rem">
                  <i-hstack
                    id="hsCopy"
                    class="pointer"
                    verticalAlignment="center"
                    tooltip={{ content: `The address has been copied`, trigger: 'click' }}
                    gap="0.5rem"
                  >
                    <i-icon
                      name="copy"
                      width="16px"
                      height="16px"
                      fill={Theme.text.primary}
                    ></i-icon>
                    <i-label caption="Copy Address" font={{ size: "0.875rem", bold: true }} />
                  </i-hstack>
                  <i-hstack id="hsViewAccount" class="pointer" verticalAlignment="center" onClick={this.viewOnExplorerByAddress.bind(this)}>
                    <i-icon name="external-link-alt" width="16" height="16" fill={Theme.text.primary} display="inline-block" />
                    <i-label id="lblViewAccount" caption="View on Etherscan" margin={{ left: "0.5rem" }} font={{ size: "0.875rem", bold: true }} />
                  </i-hstack>
                </i-hstack>
              </i-panel>
            </i-modal>
          </i-panel>
        )
    }

    connectedCallback() {
      super.connectedCallback();
      window.addEventListener('resize', (e) => {
        this.controlMenuDisplay();
      });
    }
};
export interface HeaderElement extends ControlElement{
  
}
declare global {
  namespace JSX {
      interface IntrinsicElements {
          ["main-header"]: HeaderElement;
      }
  }
};