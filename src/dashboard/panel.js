import './panel.css';

document.getElementById('path').textContent = `nodecg${window.location.pathname}`;

// You can access the NodeCG api anytime from the `window.nodecg` object
// Or just `nodecg` for short. Like this!:
nodecg.log.info('Here\'s an example of using NodeCG\'s logging API!');