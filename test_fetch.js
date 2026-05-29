fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
  .then(() => console.log('success'))
  .catch(e => console.log('error', e.message));
