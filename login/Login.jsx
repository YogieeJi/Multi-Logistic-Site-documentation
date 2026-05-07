import React, { useEffect, useRef, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useNavigate } from 'react-router-dom';
import { Toast } from "primereact/toast";
import { Controller, useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { authActions } from '../../store';
import { history } from '../../helpers';


const LoginPage = () => {
    let password = '';
    const [checked, setChecked] = useState(false);
    let email = '';

    // Form var
    const toast = useRef(null);
    const defaultValues = { email: '', password: '' };
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    const dispatch = useDispatch();
    const authUser = useSelector(x => x.auth.user);
    const authError = useSelector(x => x.auth.error);

    const navigate = useNavigate();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': 'filled' });

    //Old Code

    // useEffect(() => {
    //     // redirect to home if already logged in
    //     if (authUser) history.navigate('/');

    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);
    useEffect(() => {
        if (authUser) {
            navigate('/');
        }
    }, [authUser]);


    const show = () => {
    };

    const onSubmit = (data) => {
        //  show();
        // form.reset();
        // navigate('/');
        email = form.getValues('email');
        password = form.getValues('password');
        // dispatch(authActions.login({ email, password }))
        //     .unwrap()
        //     .then((originalPromiseResult) => {
        //         toast.current.show({ severity: 'success', summary: 'Login Success', detail: originalPromiseResult.message });
        //     }).catch((error) => {
        //         const message = error || 'Invalid Username or Password';

        //         toast.current.show({
        //             severity: 'error',
        //             summary: 'Login Error',
        //             detail: message
        //         });
        //     });
        //New Code
        dispatch(authActions.login({ email, password }))
            .unwrap()
            .then((res) => {

                toast.current.show({
                    severity: 'success',
                    summary: 'Login Success',
                    detail: res.message
                });


            })
            .catch((error) => {
                const message = error || 'Invalid Username or Password';

                toast.current.show({
                  severity: 'error',
                   summary: 'Login Error',
                detail: message
                });
            });
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };



    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <Toast ref={toast} />

                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/assets/layout/images/logo-dark.png" alt="Image" height="50" className="mb-3" />
                        </div>

                        <div>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-column gap-2">

                                <Controller
                                    name="email"
                                    control={form.control}
                                    rules={{
                                        required: 'Email is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label className='block text-900 text-xl font-medium mb-2'>
                                                Email
                                            </label>
                                            {getFormErrorMessage(field.name)}
                                            <InputText inputid={field.name} name='email' type="text" value={field.value} placeholder="Email address" className={classNames({ 'p-invalid': fieldState.error }, "w-full md:w-30rem mb-5")} style={{ padding: '1rem' }} onChange={(e) => field.onChange(e.target.value)} />

                                        </>
                                    )}
                                />


                                <Controller
                                    name="password"
                                    control={form.control}
                                    rules={{
                                        required: 'Password is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label className="block text-900 font-medium text-xl mb-2">
                                                Password
                                            </label>
                                            {getFormErrorMessage(field.name)}
                                            <Password inputid={field.name} feedback={false} name='password' value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder="Password" toggleMask className={classNames({ 'p-invalid': fieldState.error }, "w-full mb-5")} inputClassName="w-full p-3 md:w-30rem"></Password>
                                        </>
                                    )}
                                />

                                <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                    <div className="flex align-items-center">
                                        <Checkbox inputid="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked)} className="mr-2"></Checkbox>
                                        <label htmlFor="rememberme1">Remember me</label>
                                    </div>
                                    <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                        Forgot password?
                                    </a>
                                </div>
                                <Button label="Sign In" type='submit' className="w-full p-3 text-xl" ></Button>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default LoginPage;
