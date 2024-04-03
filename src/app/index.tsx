import { createRoot } from 'react-dom/client';
import {Main} from './components/Main';


let elRoot = document.querySelector('#root');
if (!elRoot) {
  elRoot = document.createElement('div');
  elRoot.setAttribute('id', 'root');
  document.body.appendChild(elRoot);
}

const root = createRoot(elRoot);

root.render(<Main />);