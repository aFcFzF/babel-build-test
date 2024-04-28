import { createRoot } from 'react-dom/client';
import { BrowserRouter, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Case1 } from './components/Case1';
import { Case2 } from './components/Case2';
import { Case3 } from './components/Case3';
import { Case4 } from './components/Case4';
// import { Main } from './components/Main';


let elRoot = document.querySelector('#root');
if (!elRoot) {
  elRoot = document.createElement('div');
  elRoot.setAttribute('id', 'root');
  document.body.appendChild(elRoot);
}

const root = createRoot(elRoot);

const router = createBrowserRouter([
  {
    path: '/',
    element: <>hello</>,
  },
  {
    path: '/case1',
    element: <Case1 uid="123" />,
  },
  {
    path: '/case2',
    element: <Case2 />,
  },
  {
    loader() {
      return {
        name: "111",
      }
    },
    path: '/case3',
    element: <Case3 />,
  },
  {
    path: '/case4',
    element: <Case4 />,
  },
  {
    path: '*',
    element: <>not found</>
  }
], {basename: '/app'});

const Main = (): JSX.Element => {
  return (
    <RouterProvider  router={router} />
  );
}

root.render(<Main />);