import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';

import { addData } from '../../../../store/formMessage.slice';
import { Checkbox } from "primereact/checkbox";
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { CountService } from '../../../../service/Count/CountService';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';

import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';

import { InputSwitch } from 'primereact/inputswitch';
export default function AddProduct(){
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const [productDetail, setProductDetail] = useState(null);
    const [UserDropDown, setUserDropDown] = useState(null);
    const matchedPath = matchPath({path:'/products/items/edit',end:false},routePath.pathname);
;
    const [heading, setHeading] = useState('Count Creation');

   

    // let networkTimeout = null;

  

        const storedData = JSON.parse(localStorage.getItem('user'));

        const userId = storedData?.user?.id || null;
    useEffect(() => {

         getUser();
    }, []);

   
    const getUser = () => {
     
        CountService.getUser().then((data) => {
            
            setUserDropDown(data.data); 
        }).catch((error) => {
            console.error('Error fetching users:', error);
        });

    };
    const defaultValues = {
        Aisle: '',
        level: '',
        // category: [] ,
        User: null,
        defaultCountName: ''
    }
   
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    let networkTimeout = null;

    
  

    const onSubmit = (data) => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        data = {
                ...data,   
                selectedCategories,
                userId
        }



            CountService.CreateCount( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    setSelectedCategories([]);
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Count Created'}));
                    navigate("/count/setup");
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Creating Count', detail: data.message});
                }
            });
        
        //     ProductService.updateProduct(params.id, data).then((data) => {
        //         setLoading(false);
        //         if(data.error == 0){
        //             form.reset();
        //             dispatch(addData({severity: 'success', detail: data.message, summary: 'Product Updated'}));
        //             // toast.current.show({ severity: 'success', summary: 'Product Created', detail: data.message});
        //             navigate("/products/items")
        //         } else{
        //             toast.current.show({ severity: 'error', summary: 'Error in Product', detail: data.message});
        //         }
        //     });
        // }
    };

    const getDesc = (sku) => {
        if(matchedPath === null){
            if (networkTimeout) {
                clearTimeout(networkTimeout);
            }
            if(sku != null && sku != ''){
                networkTimeout = setTimeout(() => {
                    ProductService.getProductDesc({sku}).then((data) => {
                        form.setValue('desc',form.getValues('sku')+' - '+data.desc.Product_Name??'');
                    });
                }, 2000);
            }
        }
    }



    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

  

    
  
  

      const categories = [
        { name: 'UPC Scan (with lot number)', key: 'Upc' },
        { name: 'Quantity Check', key: 'Quantity' },
        { name: 'Expiry Date Check', key: 'Expiry' },

    ];
    const [selectedCategories, setSelectedCategories] = useState(categories);

    const onCategoryChange = (e) => {
        let _selectedCategories = [...selectedCategories];

        if (e.checked)
            _selectedCategories.push(e.value);
        else
            _selectedCategories = _selectedCategories.filter(category => category.key !== e.value.key);

        setSelectedCategories(_selectedCategories);
    };

    const handleAisleChange = (e) => {
        const aisleValue = form.getValues('Aisle');
        const level = form.getValues('level');
    
        const countName = aisleValue ? `${aisleValue}-${level}` : ''; 
        form.setValue('defaultCountName', countName);
        form.setValue('Aisle', aisleValue); 
      };
     



    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
            </div>
            <h1></h1>
            <Toast ref={toast} />

            <form onSubmit={form.handleSubmit(onSubmit)} className="">
            <div className="grid flex flex-column align-items-center">
                <div className="col-6">
                    <div className="card">
                <h3>{heading}</h3>
                        <br/>
                        <div className="p-fluid formgrid grid  flex flex-column align-items-center gap-3">
                            <div className="field col-12 md:col-4">
                            <Controller
                                    name="Aisle"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Aisle is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Aisle*</label>
                                            <InputText id={field.name} value={field.value || ''}  type="text" className={classNames({ 'p-invalid': fieldState.error })}  onChange={(e) => {
                                        field.onChange(e.target.value.toUpperCase());
                                        
                                        }}
                                             />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />

                                       
                            </div>

                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="level"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Level is required.',
                                        validate: value => /^[1-5]$/.test(value) || 'Level must be between 1 and 5'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Level*</label>
                                            <InputText id={field.name} value={field.value || ''}  type="text" className={classNames({ 'p-invalid': fieldState.error })} onChange={(e) => {
                                                const value = e.target.value;
                                         field.onChange(value);
                                        const level = parseInt(value, 10);

                                        // Validate in real-time
                                        if ( level < 1 || level > 5) {
                                          form.setError('level', {
                                            type: 'manual',
                                            message: 'Level must be a number between 1 and 5',
                                          });
                                        } else {
                                          form.clearErrors('level');
                                        }
                                        handleAisleChange(e); 
                                        }}/>
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>


                            <div className="flex flex-column gap-3">
                                {categories.map((category) => (
                                    <div key={category.key} className="flex align-items-center">
                                        <Checkbox 
                                            inputId={category.key} 
                                            name="category" 
                                            value={category} 
                                            onChange={onCategoryChange} 
                                            checked={selectedCategories.some((item) => item.key === category.key)} 
                                        />
                                        <label htmlFor={category.key} className="ml-2">{category.name}</label>
                                    </div>
                                ))}
                            </div>


                            {/* <div className="field col-12 md:col-4">
                                <Controller
                                    name="User"
                                    control={form.control}
                                    rules={{ 
                                        required: 'User is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Select User*</label>
                                            <Dropdown id={field.name} value={field.value} key={field.name} style={{marginRight:5, marginLeft:10}} optionValue="code" optionLabel="name" onChange={(e) => {
                                            field.onChange(e.target.value);
                                           

                                            form.setValue('uom_2', null); 
                                        }} options={UserDropDown} placeholder="Select" className={classNames({ 'p-invalid': fieldState.error })} />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div> */}

                            <div className="field col-12 md:col-4">
                                    <Controller
                                        name="User"
                                        control={form.control}
                                         rules={{ required: 'User is required.' }}
                                        render={({ field, fieldState }) => (
                                        <>
                                            <label>User*</label>
                                            <Dropdown
                                            id={field.name}
                                            value={field.value}
                                            key={field.name}
                                            editable
                                            optionValue="usr_ID" 
                                            optionLabel="name"
                                            onChange={(e) => field.onChange(e.target.value)}
                                            options={UserDropDown}
                                            placeholder="Select a User"
                                            className={classNames({ 'p-invalid': fieldState.error })}
                                            />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                        )}
                                    />
                                    </div>
                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="defaultCountName"
                                    control={form.control}
                                    rules={{ 
                                        required: 'CountName is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Count Name*</label>
                                            <InputText id={field.name} 
                                              value={field.value || ''} 
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
    
                            
                        </div>
                    </div>
                    <div className="flex justify-content-center  flex-wrap align-items-center gap-3">
                    <Button label="Cancel" onClick={() => navigate("/count/setup")} type='button' severity="secondary" className="w-3 p-3 mt-3 " outlined ></Button>
                    <Button label="Create Count" loading={loading} type='submit' className="w-3 p-3 mt-3" ></Button>
                    </div>

              
                 
                 
                </div>
            </div>
            </form>

        </>
       
    );
};

