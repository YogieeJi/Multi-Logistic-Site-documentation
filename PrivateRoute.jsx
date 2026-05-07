import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { history } from '../helpers';

export { PrivateRoute };

function PrivateRoute({ children, permission }) {
    const { user: authUser } = useSelector(x => x.auth);
    const userinfo = useSelector((state) => state?.auth?.user)
    let keys = [];
    
    if (userinfo && userinfo.user) {
    if (userinfo.user.user_role_id != 0) {   
        keys = userinfo.user.actionPermissions
            ?.filter(p => p.permission?.view?.allowed === true)
            .map(p => p.page_key) || [];
    }
}
    
    if (!authUser) {
        // not logged in so redirect to login page with the return url
        return <Navigate to="/login" state={{ from: history.location }} />
    }
    if(import.meta.env.IS_PRODUCTION !== 'yes')  {
        //console.log(keys.includes(permission))
        if (permission != '' && !keys.includes(permission) && children._owner.pendingProps.location.pathname != '/' && userinfo.user.user_role_id != 0) {
            return <Navigate to="/" state={{ from: history.location }} />
        }
    }
    else {
        if(children._owner !=null) {
            if (children._owner.pendingProps !=null) {
                if (permission != '' && !keys.includes(permission) && children._owner.pendingProps.location.pathname != '/' && userinfo.user.user_role_id != 0) {
                    return <Navigate to="/" state={{ from: history.location }} />
                }
            }
        }
    }

    // if(children._owner !=null) {
    //     if (children._owner.pendingProps !=null) {
    //         if (permission != '' && !keys.includes(permission) && children._owner.pendingProps.location.pathname != '/' && userinfo.user.user_role_id != 0) {
    //             return <Navigate to="/" state={{ from: history.location }} />
    //         }
    //     }
    // }

    // authorized so return child components
    return children;
}