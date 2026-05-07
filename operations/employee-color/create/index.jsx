import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';

import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { ProductService } from '../../../../service/products/ProductService';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Password } from 'primereact/password';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { RoleSettingService } from '../../../../service/settings/RoleSettingService';
import { EmployeeColorService } from '../../../../service/operations/EmployeeColorService';

export default function AddEmployeeColor(){
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const [colorDetail, setColortDetail] = useState({});
    const matchedPath = matchPath({path:'/operations/employee-color/edit',end:false},routePath.pathname);
    const [passwordRule, setPasswordRule] = useState({});

    let networkTimeout = null;


    const [dropDownUsers, setDropDownUsers] = useState([]);

    const [heading, setHeading] = useState('Assign Employee Color');

    let defaultValues = { 
        color: '',
        mantis_id: '',
    };

    useEffect(() => {
        // getUserLookup();
        getAllUserLookup()
        if(matchedPath !== null){
           
            getDetails();
            setHeading('Edit Employee Color');
        } 

        
    }, []);

    const getUserLookup = () => {
        EmployeeColorService.mantisEmployeesLookup(params.id).then((data) => {
            setDropDownUsers(data.data);
        });
    };
    const getAllUserLookup = () => {
        EmployeeColorService.mantisAllEmployeesLookup().then((data) => {
            setDropDownUsers(data.data);
        });
    };

    const getDetails = () => {
        EmployeeColorService.getDetail(params.id).then((data) => {
            setColortDetail(data.data);
            
            form.setValue('color',data.data.color??'');
            form.setValue('mantis_id',data.data.usr_Login??'');
        });
    };

   
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

 
    const onSubmit = (data) => {
        
        const mantis_id = form.getValues('mantis_id');
       
        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        data = {
            color: form.getValues('color'),
            mantis_id: (isNaN(mantis_id)) ? colorDetail.id : mantis_id,
        }
        
        setLoading(true);
        if(matchedPath === null){
            EmployeeColorService.add( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Employee Color Created'}));
                    // toast.current.show({ severity: 'success', summary: 'Product Created', detail: data.message});
                    navigate("/operations/employee-color")
                } 
                else if(data.errors){
                    toast.current.show({ severity: 'error', summary: 'Error in Employee Color', detail: data.message});
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Employee Color', detail: data.message});
                }
            });
        } else{
            EmployeeColorService.update(params.id, data).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Employee Color Updated'}));
                    // toast.current.show({ severity: 'success', summary: 'Product Created', detail: data.message});
                    navigate("/operations/employee-color")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Employee Color', detail: data.message});
                }
            });
        }
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

  

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{heading}</h3>
            </div>
            <h1></h1>
            <Toast ref={toast} />

            <form onSubmit={form.handleSubmit(onSubmit)} className="">
            <div className="grid">
                <div className="col-12">
                    
                    <div className="card">
                        <h4>Info</h4>
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="color"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Color is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Color *</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                onChange={(e) => {
                                                    field.onChange(e.target.value)
                                                }} 
                                            />
                                             {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>
                      
                            <hr />
                            <div className="field col-12 md:col-6">
                                <Controller
                                    name="mantis_id"
                                    control={form.control}
                                    rules={{ 
                                        required: 'User is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Mantis User*</label>
                                            <Dropdown id={field.name} editable value={field.value} key={field.name} style={{marginRight:5, marginLeft:10}} filter optionValue="usr_ID" optionLabel="usr_Login" onChange={(e) => field.onChange(e.target.value)} options={dropDownUsers} placeholder="Select" className={classNames({ 'p-invalid': fieldState.error })} />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <Button label="Submit" loading={loading} type='submit' className="w-3 p-3 mt-3" ></Button>
                </div>
            </div>
            </form>

        </>
       
    );
};

