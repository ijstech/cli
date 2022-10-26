import {
  application,
  customElements,
  Module,
  ControlElement,
  Styles,
  Container,
  Image,
  Label
} from '@ijstech/components';
import Assets from '@dapp/assets';

const Theme = Styles.Theme.ThemeVars;

export interface FooterElement extends ControlElement {
  logo?: string;
  copyrightInfo?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ["main-footer"]: FooterElement;
    }
  }
};

@customElements('main-footer')
export class Footer extends Module {
  private lblLogo: Label;
  private lblCopyright: Label;

  init() {
    super.init();
    const logo = this.getAttribute('logo', true, "");
    this.lblLogo.caption = logo;
    const copyright = this.getAttribute('copyrightInfo', true, "");
    this.lblCopyright.caption = copyright;
    this.lblCopyright.visible = !!copyright;
  }

  render() {
    return (
      <i-panel padding={{ top: '1.75rem', bottom: '1.75rem', left: '1rem', right: '1rem' }}>
        <i-hstack horizontalAlignment="space-between" verticalAlignment="center" width="100%">
          <i-vstack gap="1rem">
            <i-label id="lblLogo" font={{ size: '1.25rem', bold: true, color: Theme.text.secondary }}></i-label>
            <i-label id="lblCopyright" font={{ color: Theme.text.primary, size: '0.875em' }}></i-label>
          </i-vstack>
        </i-hstack>
      </i-panel>
    )
  }
}