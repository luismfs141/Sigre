import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import AppReducer from './AppReducer';

const rootReducer = combineReducers({ AppReducer });

const Store = createStore(rootReducer, applyMiddleware(thunk));

export default Store;