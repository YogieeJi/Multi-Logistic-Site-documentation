import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
// import { ZoneService } from '../../../../../service/operations/ZoneService';
import { ItemLotExpiryService } from '../../../../service/operations/ItemLotExpiryService';
import { Dropdown } from 'primereact/dropdown';
import { ProductService } from '../../../../service/products/ProductService';
import { Calendar } from 'primereact/calendar';

export default function AddItemLotExp() {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const [dropDownLoading, setDropDownLoading] = useState(true);
    const matchedPath = matchPath({ path: '/operations/item-lot-expiry/edit', end: false }, routePath.pathname);

    const [warehouseDropdownlist, setWarehouseDropdownlist] = useState(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    const [itemDropdownlist, setItemDropdownlist] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    const [heading, setHeading] = useState('Add Item Lot Expiry');
    const dateRef = useRef(null);
    const dateFromRef = useRef(null);

    let defaultValues = {
        warehouse: '',
        item: '',
        lot_number: '',
        exp_date: '',
        first_receipt_date: '',
    };

    
    const parseLocalDate = (dateString) => {
        if (!dateString) return null;

        if (dateString instanceof Date) return dateString;

        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    
    const formatDate = (date) => {
        if (!date) return null;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        getDropdownValues();
        if (matchedPath !== null) {
            getDetails();
            setHeading('Edit Item Lot Expiry');
        }
    }, []);

    const getDetails = () => {
        ItemLotExpiryService.getDetail(params.id).then((data) => {
            form.setValue('warehouse', data.data.warehouse ?? '');
            form.setValue('item', data.data.item ?? '');
            form.setValue('lot_number', data.data.lot_number ?? '');

            
            form.setValue(
                'exp_date',
                data.data.exp_date ? formatDate(new Date(data.data.exp_date)) : null
            );

           
            form.setValue(
                'first_receipt_date',
                data.data.first_receipt_date ? formatDate(new Date(data.data.first_receipt_date)) : null
            );
        });
    };

    const getDropdownValues = () => {
        ProductService.getAllItems()
            .then((data) => {
                setItemDropdownlist(data.data);
                setDropDownLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setDropDownLoading(false);
            });
    };

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    let networkTimeout = null;

    const onSubmit = (data) => {
        const itemObj = form.getValues('item');

        data = {
            warehouse: form.getValues('warehouse'),
            item: (itemObj?.prd_PrimaryCode == null) ? itemObj : itemObj?.prd_PrimaryCode,
            lot_number: form.getValues('lot_number'),
            exp_date: form.getValues('exp_date'),
            first_receipt_date: form.getValues('first_receipt_date'),
        };

        setLoading(true);

        if (matchedPath === null) {
            ItemLotExpiryService.add(data)
                .then((res) => {
                    setLoading(false);

                    if (res.error === 0) {
                        form.reset();
                        dispatch(addData({
                            severity: 'success',
                            detail: res.message,
                            summary: 'Item Lot Expiry Created'
                        }));
                        navigate("/operations/item-lot-expiry");
                    } else {
                        toast.current.show({
                            severity: 'error',
                            summary: 'Error in Item Lot Expiry',
                            detail: res.message
                        });
                    }
                })
                .catch((error) => {
                    setLoading(false);

                    toast.current.show({
                        severity: 'error',
                        summary: 'Error in Item Lot Expiry',
                        detail: error?.response?.data?.message || 'Something went wrong'
                    });
                });
        }
        else {
            ItemLotExpiryService.update(params.id, data).then((data) => {
                setLoading(false);
                if (data.error == 0) {
                    form.reset();
                    dispatch(addData({ severity: 'success', detail: data.message, summary: 'Item Lot Expiry Updated' }));
                    navigate("/operations/item-lot-expiry");
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error in Item Lot Expiry', detail: data.message });
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
                            <div className="p-fluid formgrid grid">
                                <div className="field col-12 md:col-6">
                                    <Controller
                                        name="item"
                                        control={form.control}
                                        rules={{
                                            required: 'Item is required.',
                                            validate: (value) =>
                                                value?.trim()?.length > 0 || 'Item is required.'
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Item*</label>
                                                <InputText
                                                    id={field.name}
                                                    value={field.value}
                                                    type="text"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value);
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>

                                <div className="field col-12 md:col-6">
                                    <Controller
                                        name="lot_number"
                                        control={form.control}
                                        rules={{
                                            required: 'Lot Number is required.',
                                            validate: (value) =>
                                                value?.trim()?.length > 0 || 'Lot Number is required.'
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Lot Number*</label>
                                                <InputText
                                                    id={field.name}
                                                    value={field.value}
                                                    type="text"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value);
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>

                                <div className="field col-12 md:col-6">
                                    <Controller
                                        name="exp_date"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Expiry Date </label>
                                                <Calendar
                                                    id={field.name}
                                                    ref={dateRef}
                                                    placeholder='Select Date'
                                                    dateFormat='yy-mm-dd'
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    value={field.value ? parseLocalDate(field.value) : null}
                                                    onChange={(e) => {
                                                        field.onChange(formatDate(e.value));
                                                    }}
                                                    showIcon
                                                    showButtonBar
                                                    showOnFocus={false}
                                                    inputRef={(el) => {
                                                        if (el) {
                                                            el.onmousedown = (e) => {
                                                                e.preventDefault();
                                                                dateRef.current.show();
                                                            };
                                                        }
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>

                                <div className="field col-12 md:col-6">
                                    <Controller
                                        name="first_receipt_date"
                                        control={form.control}
                                        rules={{
                                            required: 'First Receipt Date is required.'
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>First Receipt Date*</label>
                                                <Calendar
                                                    id={field.name}
                                                    ref={dateFromRef}
                                                    placeholder='Select Date'
                                                    dateFormat='yy-mm-dd' 
                                                    value={field.value ? parseLocalDate(field.value) : null}
                                                    onChange={(e) => {
                                                        field.onChange(formatDate(e.value));
                                                    }}
                                                    showIcon
                                                    showOnFocus={false}
                                                    inputRef={(el) => {
                                                        if (el) {
                                                            el.onmousedown = (e) => {
                                                                e.preventDefault();
                                                                dateFromRef.current.show();
                                                            };
                                                        }
                                                    }}
                                                    showButtonBar
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>

                                <div className="field col-12 md:col-6">
                                    <Controller
                                        name="warehouse"
                                        control={form.control}
                                        // rules={{
                                        //     required: 'Warehouse is required.'
                                        // }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Warehouse</label>
                                                <InputText
                                                    id={field.name}
                                                    value={field.value}
                                                    type="text"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value);
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button label="Submit" loading={loading} type='submit' className="w-3 p-3 mt-3"></Button>
                    </div>
                </div>
            </form>
        </>
    );
}