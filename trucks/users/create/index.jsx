import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ManageTrucksService } from '../../../../service/setups/ManageTrucksService';
import { addData } from '../../../../store/formMessage.slice';
export default function UserForm() {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const toast = useRef(null);
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
 const dispatch = useDispatch()
    // Dropdown data states
    const [userCategories, setUserCategories] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [logisticSites, setLogisticSites] = useState([]);


    const defaultValues = {
        login: '',
        password: '',
        firstName: '',
        lastName: '',
        logisticSite: "5"

      
       
    };

    // Load dropdown data
    useEffect(() => {
        const fetchDropdownData = async () => {
            setLoading(true);
            try {
                const [categoriesResponse, empsResponse, logSiteResponse] = await Promise.all([
                    ManageTrucksService.getUserCategories(),
                    ManageTrucksService.getEmployees(),
                    ManageTrucksService.getLogisticSites()
                ]);

                // Ensure logisticSites is an array
                const logisticSites = Array.isArray(logSiteResponse?.data) 
                    ? logSiteResponse.data 
                    : Array.isArray(logSiteResponse)
                    ? logSiteResponse
                    : [];
                
                // Format logisticSites for dropdown
                setLogisticSites(logisticSites.map(site => ({ 
                    name: site.los_Description, 
                    id: site.los_ID,
                })));
                
                // Ensure categories is an array
                const categories = Array.isArray(categoriesResponse?.data) 
                    ? categoriesResponse.data 
                    : Array.isArray(categoriesResponse)
                    ? categoriesResponse
                    : [];
                
                // Format user categories for dropdown
                setUserCategories(categories.map(category => ({ 
                    name: category.usc_Description, 
                    id: category.usc_ID,
                    code: category.usc_Code
                })));
                
                // Ensure employees is an array
                const emps = Array.isArray(empsResponse?.data)
                    ? empsResponse.data
                    : Array.isArray(empsResponse)
                    ? empsResponse
                    : [];
                
                // Format employees for dropdown
                setEmployees(emps.map(employee => ({
                    name: employee.egr_Name,
                    id: employee.egr_ID
                })));

                if (isEditMode) {
                    const userResponse = await ManageTrucksService.getUserById(id);
                    const userData = userResponse?.data || userResponse;
                    // if (userData) {
                    //     form.reset({
                    //         ...userData,
                    //         userCategory: userData.categories?.map(c => c.usc_ID) || [],
                    //         employee: userData.employees?.map(e => e.egr_ID) || []
                    //     });
                    // }
                }
            } catch (error) {
                showError('Failed to load form data');
                console.error('Error loading form data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDropdownData();
    }, [id]);

    const form = useForm({ defaultValues });
    const { control, handleSubmit, formState: { errors } } = form;

    const showError = (message) => {
        toast.current.show({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 3000
        });
    };

    const onSubmit = async (data) => {
        setSubmitting(true);
        try {
            const payload = {
                login: data.login,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                userCategoryIds: ['1,4'],
                employeeGroupIds: ['1'],
                logisticSiteID: data.logisticSite
            };

            if (isEditMode) {
                await ManageTrucksService.updateUser(id, payload);
                showSuccess('User updated successfully');
            } else {
                 const response = await ManageTrucksService.CreateMantisUsers(payload);

                if (response.error == 0) {
                        dispatch(addData({
                            severity: 'success',
                            detail: response.message,
                            summary: 'User Created'
                        }));
                    } else {
                         dispatch(addData(toast.current.show({
                            severity: 'error',
                            detail: response.message,
                            summary: 'Error in User Creation'
                        })));
                    }
            }
            navigate('/users');
        }  finally {
            setSubmitting(false);
        }
    };

    const showSuccess = (message) => {
        toast.current.show({
            severity: 'success',
            summary: 'Success',
            detail: message,
            life: 3000
        });
    };

    return (
        <div className="card p-fluid">
            <Toast ref={toast} />
            <h2>{isEditMode ? 'Edit User' : 'Create User'}</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid grid">
                {/* Login and Password */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="login" className="block">
                        Login *
                    </label>
                    <Controller
                        name="login"
                        control={control}
                        rules={{ required: 'Login is required' }}
                        render={({ field, fieldState }) => (
                            <>
                                <InputText
                                    id="login"
                                    {...field}
                                    className={classNames({ 'p-invalid': fieldState.error })}
                                    disabled={isEditMode}
                                />
                                {errors.login && (
                                    <small className="p-error">{errors.login.message}</small>
                                )}
                            </>
                        )}
                    />
                </div>

                {!isEditMode && (
                    <div className="field col-12 md:col-6">
                        <label htmlFor="password" className="block">
                            Password *
                        </label>
                        <Controller
                            name="password"
                            control={control}
                            rules={{
                                required: 'Password is required'
                            }}
                            render={({ field, fieldState }) => (
                                <>
                                    <InputText
                                        id="password"
                                        {...field}
                                        type="password"
                                        className={classNames({ 'p-invalid': fieldState.error })}
                                    />
                                    {errors.password && (
                                        <small className="p-error">{errors.password.message}</small>
                                    )}
                                </>
                            )}
                        />
                    </div>
                )}

                

                {/* First and Last Name */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="firstName" className="block">
                        First Name *
                    </label>
                    <Controller
                        name="firstName"
                        control={control}
                        rules={{ required: 'First name is required' }}
                        render={({ field, fieldState }) => (
                            <>
                                <InputText
                                    id="firstName"
                                    {...field}
                                    className={classNames({ 'p-invalid': fieldState.error })}
                                />
                                {errors.firstName && (
                                    <small className="p-error">{errors.firstName.message}</small>
                                )}
                            </>
                        )}
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label htmlFor="lastName" className="block">
                        Last Name *
                    </label>
                    <Controller
                        name="lastName"
                        control={control}
                        rules={{ required: 'Last name is required' }}
                        render={({ field, fieldState }) => (
                            <>
                                <InputText
                                    id="lastName"
                                    {...field}
                                    className={classNames({ 'p-invalid': fieldState.error })}
                                />
                                {errors.lastName && (
                                    <small className="p-error">{errors.lastName.message}</small>
                                )}
                            </>
                        )}
                    />
                </div>
               
                {/* User Category (Multiple Dropdown - Required) */}
                {/* <div className="field col-12 md:col-6">
                    <label htmlFor="userCategory" className="block">
                        User Category *
                    </label>
                    <Controller
                        name="userCategory"
                        control={control}
                        rules={{ required: 'At least one category is required' }}
                        render={({ field, fieldState }) => (
                            <>
                                <MultiSelect
                                    id="userCategory"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={userCategories}
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select categories"
                                    className={classNames({ 'p-invalid': fieldState.error })}
                                    display="chip"
                                />
                                {errors.userCategory && (
                                    <small className="p-error">{errors.userCategory.message}</small>
                                )}
                            </>
                        )}
                    />
                </div> */}

                {/* Employee (Multiple Dropdown - Optional) */}
                {/* <div className="field col-12 md:col-6">
                    <label htmlFor="employee" className="block">
                        Employee Group
                    </label>
                    <Controller
                        name="employee"
                        control={control}
                        render={({ field }) => (
                            <MultiSelect
                                id="employee"
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                options={employees}
                                optionLabel="name"
                                optionValue="id"
                                placeholder="Select employees"
                                display="chip"
                            />
                        )}
                    />
                </div> */}
                {/* logistic Site (Multiple Dropdown - Optional) */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="logisticSite" className="block">
                        Logistic Site 
                    </label>
                    <Controller
                        name="logisticSite"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
    id="logisticSite"
    value={field.value}
    onChange={(e) => field.onChange(e.value)}
    options={logisticSites}
    optionLabel="name"
    optionValue="id"
    placeholder="Select logistic site"
/>

                        )}
                    />
                </div>
                            
                {/* Empty column to maintain grid alignment */}
                <div className="field col-8">
                <Button label="Cancel" onClick={() => navigate("/users")} type='button' severity="secondary" className="w-2 p-2 mt-2 mr-2 " outlined ></Button>
                <Button label="Submit" loading={submitting} type='submit' className="w-2 p-2 mt-2" ></Button>
                                 
                </div>
            </form>
        </div>
    );
}