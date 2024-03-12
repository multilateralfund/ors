import { ColGroupDef } from 'ag-grid-community'

const defaultColGroupDef: Omit<ColGroupDef, 'children'> = {
  headerGroupComponentParams: {
    className: 'font-bold',
  },
}

export default defaultColGroupDef
