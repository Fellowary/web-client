import React from 'react'
import ReactDOM from 'react-dom'
import { createHashHistory } from 'history'
import { createStore, applyMiddleware, compose } from 'redux'

import { Provider } from 'react-redux'
// import { logger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga'
import { routerMiddleware } from 'connected-react-router'

import reducers from './redux/reducers'
import sagas from './redux/sagas'
import Router from './router'

import * as serviceWorker from './serviceWorker'

// app styles
import './global.scss'

// chrome & firefox extension
// window.browser = window.chrome ? undefined : require("webextension-polyfill");
// window.browser = window.browser !== undefined ? window.browser : require("webextension-polyfill");
try {
	window.browser = require("webextension-polyfill"); //eslint-disable-line
}
catch (err){
	console.debug("could not load webextension-polyfill", err);
}


// middlewared
const history = createHashHistory()
const sagaMiddleware = createSagaMiddleware()
const routeMiddleware = routerMiddleware(history)
const middlewares = [sagaMiddleware, routeMiddleware]
// if (process.env.NODE_ENV === 'development') {
//   middlewares.push(logger)
// }
const store = createStore(reducers(history), compose(applyMiddleware(...middlewares)))
window.store = store;
sagaMiddleware.run(sagas)

ReactDOM.render(
  <Provider store={store}>
    <Router history={history} />
  </Provider>,
  document.getElementById('root'),
)

// ---
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
export { store, history }
