'use client'

import InvoicesView from '../Invoices/InvoicesView'
import PaymentsView from '../Payments/PaymentsView'

interface IInOutFlowsViewProps {
  section: string
}

const InOutFlowsView = (props: IInOutFlowsViewProps) => {
  const { section } = props

  return section === 'payments' ? <PaymentsView /> : <InvoicesView />
}

export default InOutFlowsView
