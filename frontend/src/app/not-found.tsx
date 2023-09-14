import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Error from '@ors/components/theme/Error/Error'

export default function NotFound() {
  return (
    <Error
      component={FadeInOut}
      message="Page not found"
      statusCode={404}
    ></Error>
  )
}
