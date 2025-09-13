// very small stub for any MUI icon import in tests
const React = require('react');

function IconStub(props) {
  return React.createElement('span', { role: 'img', 'aria-label': 'icon', ...props });
}

module.exports = IconStub;
module.exports.default = IconStub;
