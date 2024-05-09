import defaultColGroupDef from '@ors/config/Table/columnsDef/defaultColGroupDef'
import { includes } from 'lodash'

export default function getUsagesColDef() {
  return {
    Aerosol: {
      initialWidth: 84,
    },
    'Aerosol I': {
      flex: 0.5,
    },
    'Aerosol IV': {
      flex: 0.5,
    },
    'Aerosol V': {
      flex: 0.5,
    },
    'Fire fighting': {
      initialWidth: 86,
    },
    'Fire fighting I': {
      flex: 0.7,
    },
    'Fire fighting IV': {
      flex: 0.55,
    },
    'Fire fighting V': {
      flex: 0.55,
    },
    Foam: {
      initialWidth: 84,
    },
    'Foam I': {
      flex: 0.5,
    },
    'Foam IV': {
      flex: 0.5,
    },
    'Foam V': {
      flex: 0.5,
    },
    'Fumigation I': {
      flex: 0.5,
    },
    Manufacturing: {
      flex: 0.5,
      initialWidth: 80,
      maxWidth: 80,
      minWidth: 80,
    },
    'Methyl bromide II': {
      headerGroupComponentParams: {
        ...defaultColGroupDef.headerGroupComponentParams,
        footnote: {
          content:
            'QPS = Quarantine and pre-shipment; Non-QPS = Non-quarantine and pre-shipment.',
          icon: false,
          index: '*',
          order: 0,
        },
      },
    },
    'Methyl bromide III': {
      headerGroupComponentParams: {
        ...defaultColGroupDef.headerGroupComponentParams,
        footnote: {
          content:
            'QPS = Quarantine and pre-shipment; Non-QPS = Non-quarantine and pre-shipment.',
          icon: false,
          index: '*',
          order: 0,
        },
      },
    },
    Other: {
      headerComponentParams: (props: any) => {
        const model = props.context?.variant.model
        return {
          footnote: {
            id: includes(['V'], model) ? '2' : '3',
            content:
              'Uses in other sectors that do not fall specifically within the listed sectors in the table.',
            icon: false,
            order: 3,
          },
        }
      },
      initialWidth: 84,
    },
    'Other IV': {
      flex: 0.5,
    },
    'Other V': {
      flex: 0.5,
    },
    'Process agent': {
      initialWidth: 132,
    },
    'Process agent I': {
      flex: 0.8,
    },
    Refrigeration: {
      initialWidth: 400,
    },
    'Refrigeration I': {
      flex: 0.7,
    },
    'Refrigeration Manufacturing': {
      autoHeaderHeight: true,
      flex: 1.3,
      initialWidth: 320,
    },
    'Refrigeration Manufacturing AC': {
      flex: 1,
      initialWidth: 90,
    },
    'Refrigeration Manufacturing AC I': {
      flex: 0.95,
    },
    'Refrigeration Manufacturing AC IV': {
      headerName: 'AC',
      initialWidth: 80,
    },
    'Refrigeration Manufacturing AC V': {
      flex: 1.2,
    },
    'Refrigeration Manufacturing I': {
      initialWidth: 80,
    },
    'Refrigeration Manufacturing Other': {
      autoHeaderHeight: true,
      flex: 1,
    },
    'Refrigeration Manufacturing Other V': {
      headerComponentParams: (props: any) => {
        const model = props.context?.variant.model
        return {
          footnote: {
            id: includes(['V'], model) ? '3' : '4',
            content:
              'Only if break-down of consumption in refrigeration and air-conditioning manufacturing is not available, information in "Other unidentified manufacturing" may be provided.',
            icon: false,
            order: 4,
          },
        }
      },
      initialWidth: 150,
      maxWidth: 150,
      minWidth: 150,
    },
    'Refrigeration Manufacturing Refrigeration': {
      initialWidth: 100,
    },
    'Refrigeration Manufacturing Refrigeration V': {
      flex: 1.2,
    },
    'Refrigeration Manufacturing Total IV': {
      headerComponentParams: {
        footnote: {
          id: '4',
          content:
            'If break-down of consumption in manufacturing is not available, information in total can be provided.',
          icon: false,
          order: 4,
        },
      },
      initialWidth: 120,
    },
    'Refrigeration Servicing': {
      flex: 1,
      initialWidth: 84,
    },
    'Refrigeration Servicing I': {
      initialWidth: 80,
    },
    'Solvent application I': {
      flex: 0.5,
    },
    'Tobacco fluffing I': {
      flex: 0.8,
    },
    total_usages: {
      flex: 0,
      initialWidth: 84,
    },
  }
}
