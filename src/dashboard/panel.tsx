import * as React from 'react';
import {render} from 'react-dom';
import './panel.css';
import {App} from "./panel/app";


const rootElement = document.getElementById('app');
render(<App />, rootElement);
