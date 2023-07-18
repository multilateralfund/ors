import { headers } from 'next/headers'
import jwtDecode from 'jwt-decode'
import { removeTrailingSlash } from '@ors/helpers/Url/Url'

// import { loginRenew, logout } from '@app/actions';

const __SERVER__ = typeof window === 'undefined'

export async function getAuthToken() {
  const headersList = headers()
  const referer = headersList.get('referer') || ''
  const host = __SERVER__
    ? removeTrailingSlash(referer)
    : removeTrailingSlash(window.location.origin)
  const authToken = await fetch(`${host}/auth-token`, {
    next: { revalidate: 1 },
  })
  return authToken.json()
}

// /**
//  * Persist auth token method.
//  * @method persistAuthToken
//  * @param {object} store Redux store.
//  * @returns {undefined}
//  */
// export function persistAuthToken(store, req = null) {
//   let currentValue;
//   currentValue = getAuthToken(req);

//   /**
//    * handleChange method.
//    * @method handleChange
//    * @param {bool} initial Initial call.
//    * @returns {undefined}
//    */
//   function handleChange(initial) {
//     const previousValue = currentValue;
//     const state = store.getState();
//     currentValue = state.userSession.token;

//     if (module.hot?.data?.reloaded && previousValue) {
//       currentValue = previousValue;
//       // module.hot.invalidate();
//     }

//     if (previousValue !== currentValue || initial) {
//       if (!currentValue) {
//         if (previousValue) {
//           Cookies.remove(AUTH_TOKEN, { path: '/' });
//         }
//       } else {
//         if (previousValue !== currentValue) {
//           Cookies.set(AUTH_TOKEN, currentValue, {
//             path: '/',
//             expires: new Date(jwtDecode(currentValue).exp * 1000),
//           });
//         }
//         // TODO: state lost on hot reload
//         if (!currentValue) return;
//         const exp = parseInt(
//           (jwtDecode(currentValue).exp * 1000 - new Date().getTime()) * 0.9 ||
//             3600000,
//         );

//         setTimeout(() => {
//           if (currentValue) {
//             if (jwtDecode(currentValue).exp * 1000 > new Date().getTime()) {
//               store.dispatch(loginRenew());
//             } else {
//               // Logout
//               store.dispatch(logout());
//             }
//           }
//         }, exp);
//       }
//     }
//   }
//   store.subscribe(handleChange);
//   handleChange(true);
// }

// if (module.hot) {
//   module.hot.dispose((data) => {
//     data.reloaded = true;
//   });
// }
