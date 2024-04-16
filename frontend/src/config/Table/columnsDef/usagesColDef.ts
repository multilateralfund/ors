export default function getUsagesColDef() {
  return {
    Aerosol: {
      initialWidth: 84,
    },
    'Fire fighting': {
      initialWidth: 86,
    },
    Foam: {
      initialWidth: 84,
    },
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
      initialWidth: 84,
    },
    'Process agent': {
      initialWidth: 132,
    },
    Refrigeration: {
      initialWidth: 400,
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
    'Refrigeration Manufacturing AC IV': {
      headerName: 'AC',
      initialWidth: 80,
    },
    'Refrigeration Manufacturing Other': {
      autoHeaderHeight: true,
      flex: 2,
      headerComponentParams: {
        footnote: {
          id: '5',
          content:
            'Only if break-down of consumption in refrigeration and air-conditioning manufacturing is not available, information in "Other unidentified manufacturing" may be provided.',
          icon: true,
          order: 5,
        },
      },
      initialWidth: 120,
    },
    'Refrigeration Manufacturing Other IV': {
      headerComponentParams: {},
    },
    'Refrigeration Manufacturing Refrigeration': {
      initialWidth: 100,
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
    'Refrigeration Servicing': {
      autoHeaderHeight: true,
      flex: 1,
      initialWidth: 84,
    },
    total_usages: {
      flex: 0,
      initialWidth: 84,
    },
  }
}
