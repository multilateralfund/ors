import defaultColDef from './defaultColDef'

export default function getUsagesColDef() {
  return {
    Other: {
      headerComponentParams: {
        footnote: {
          id: '3',
          content:
            'Uses in other sectors that do not fall specifically within the listed sectors in the table.',
          icon: true,
          order: 3,
        },
      },
      initialWidth: 100,
    },
    'Process agent': {
      initialWidth: 132,
    },
    'Refrigeration Manufacturing': {
      initialWidth: 132,
    },
    'Refrigeration Manufacturing AC': {
      initialWidth: 130,
    },
    'Refrigeration Manufacturing AC IV': {
      headerName: 'AC',
      initialWidth: 80,
    },
    'Refrigeration Manufacturing Other': {
      headerComponentParams: {
        footnote: {
          id: '5',
          content:
            'Only if break-down of consumption in refrigeration and air-conditioning manufacturing is not available, information in "Other unidentified manufacturing" may be provided.',
          icon: true,
          order: 5,
        },
      },
      initialWidth: 130,
    },
    'Refrigeration Manufacturing Other IV': {
      headerComponentParams: {},
    },
    'Refrigeration Manufacturing Refrigeration': {
      initialWidth: 120,
    },
    'Refrigeration Manufacturing Total IV': {
      headerComponentParams: {
        footnote: {
          id: '5',
          content:
            'If break-down of consumption in manufacturing is not available, information in total can be provided.',
          icon: true,
          order: 5,
        },
      },
      initialWidth: 120,
    },
    total_usages: {
      initialWidth: defaultColDef.minWidth,
    },
  }
}
