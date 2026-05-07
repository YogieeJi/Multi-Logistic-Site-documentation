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


  

    

    const onSubmit = (data) => {
        

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
                            
                           
                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <div className="flex align-items-center">
                                    <label htmlFor="rememberme1">Remember me</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Forgot password?
                                </a>
                            </div>
                            <Button label="Sign In" type='submit' className="w-full p-3 text-xl" ></Button>
                                    
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default LoginPage;
