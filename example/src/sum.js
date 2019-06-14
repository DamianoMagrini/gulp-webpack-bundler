export default (...args) =>
  args.reduce((accumulator = 0, current_value) => accumulator + current_value);
