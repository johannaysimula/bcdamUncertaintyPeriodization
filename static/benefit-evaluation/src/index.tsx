import ReactDOM from 'react-dom';
import { App } from './App';
import { view } from "@forge/bridge";
import { setGlobalTheme } from "@atlaskit/tokens";
import { LocaleProvider } from './i18n';

import '@atlaskit/css-reset';

view.theme.enable();
setGlobalTheme({ light: "light", dark: "dark", colorMode: 'auto' });

ReactDOM.render(
  <LocaleProvider>
    <App />
  </LocaleProvider>,
  document.getElementById('root')
);
