import config from '@ors/registry'

const getWidgetDefault = () => config.widgets.default

const getWidgetByType = (type: string) => config.widgets.type[type] || null

// const getWidgetByChoices = (props: any) => {
//   if (props.choices) {
//     return config.widgets.choices;
//   }

//   return null;
// };

const getWidgetByName = (widget: string) =>
  config.widgets.widget[widget] || null

const Field = (props: any) => {
  const Widget =
    getWidgetByName(props.widget) ||
    // getWidgetByChoices(props) ||
    getWidgetByType(props.type) ||
    getWidgetDefault()
  return <Widget {...props} />
}

export default Field
