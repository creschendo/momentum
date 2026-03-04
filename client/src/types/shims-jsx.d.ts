declare module '*.jsx' {
  const ComponentOrValue: any;
  export default ComponentOrValue;
  export = ComponentOrValue;
}

declare module '*.js' {
  const Value: any;
  export default Value;
  export = Value;
}
