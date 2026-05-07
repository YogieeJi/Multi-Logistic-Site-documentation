
import React, { useState, useRef, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConveyorLanesService } from '../../../../service/operations/ConveyorLanesService';
import { useDispatch } from 'react-redux';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { addData } from '../../../../store/formMessage.slice';
import { Dropdown } from 'primereact/dropdown';
export default function AddConveyorLanes() {
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const [laneDetail, setLaneDetail] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const matchedPath = matchPath({path:'/conveyor/conveyor-lanes/edit',end:false},routePath.pathname);
    const [heading, setHeading] = useState('Add Lane');

    let defaultValues = { 
        title: '',
        conveyor_name: '',
    };

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    useEffect(() => {
        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Lane');
        } 
    }, []);

    const getDetails = () => {
        ConveyorLanesService.getLaneDetail(params.id).then((data) => {
            setLaneDetail(data.data);
            const isErrorLane = (data.data.is_ErrorLane == 1) ? 'Yes' : 'No'; 
            const is_noread = (data.data.is_noread == 1) ? 'Yes' : 'No'; 
            const lane_type = (data.data.lane_type == 2) ? 'Shipping' : 'Receiving'; 
            form.setValue('title',data.data.title??'');
            form.setValue('conveyor_name',data.data.conveyor_name??'');
            form.setValue('conveyor_ID',data.data.conveyor_id??'');
            form.setValue('Is_ErrorLane',isErrorLane);
            form.setValue('is_noread',is_noread);
            form.setValue('lane_type',lane_type);
        });
    };


    const onSubmit = (data) => {
        setLoading(true);
        const Is_ErrorLane = (form.getValues('Is_ErrorLane') == 'Yes')  ? 1 : (form.getValues('Is_ErrorLane') == 'No') ? 0 : form.getValues('Is_ErrorLane');
        const is_noread = (form.getValues('is_noread') == 'Yes')  ? 1 : (form.getValues('is_noread') == 'No') ? 0 : form.getValues('is_noread');
        const lane_type = (form.getValues('lane_type') == 'Receiving')  ? 1 : (form.getValues('lane_type') == 'Shipping') ? 2 : form.getValues('lane_type');
        data = {
            title: form.getValues('title'),
            conveyor_name: form.getValues('conveyor_name'),
            conveyor_id: form.getValues('conveyor_ID'),
            lane_type: lane_type,
            Is_ErrorLane: Is_ErrorLane,
            is_noread: is_noread
        }
        
        if(matchedPath === null){
            ConveyorLanesService.addLane( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Lane Created'}));
                    navigate("/conveyor/conveyor-lanes")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Lane creation', detail: data.message});
                }
            });
        } else{
            ConveyorLanesService.updateLane(params.id, data).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Lane Updated'}));
                    navigate("/conveyor/conveyor-lanes")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Lane', detail: data.message});
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
                <div className="card">
                    <h1></h1>
                    <div className="p-fluid formgrid grid">
                       <div className="field col-12 md:col-4">
                            <Controller
                                name="title"
                                control={form.control}
                                rules={{ 
                                    required: 'Title is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Title</label>
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

                        <div className="field col-12 md:col-4">
                            <Controller
                                name="conveyor_ID"
                                control={form.control}
                                rules={{ 
                                    required: 'Conveyor ID is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Conveyor ID</label>
                                        <InputText id={field.name} 
                                            value={field.value} 
                                            type="number" 
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
                        <div className="field col-12 md:col-4">
                            <Controller
                                name="conveyor_name"
                                control={form.control}
                                rules={{ 
                                    required: 'Conveyor Name is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Conveyor Name</label>
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
                        <div className="field col-12 md:col-4">
                            <Controller
                                name="lane_type"
                                control={form.control}
                                rules={{ 
                                    required: 'lane type option is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Lane Type</label>
                                        <Dropdown value={field.value} 
                                         onChange={(e) => {
                                            field.onChange(e.target.value)
                                        }} 
                                        options={[{'name': 'Receiving', 'value': 1}, {'name':'Shipping', 'value': 2}]} optionLabel="name" 
                                        editable
                                         placeholder="Select" 
                                         className="" />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <Controller
                                name="is_noread"
                                control={form.control}
                                rules={{ 
                                    required: 'is_noread option is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Is No Read?</label>
                                        <Dropdown value={field.value} 
                                         onChange={(e) => {
                                            field.onChange(e.target.value)
                                        }} 
                                        options={[{'name': 'No', 'value': 0}, {'name':'Yes', 'value': 1}]} optionLabel="name" 
                                        editable
                                         placeholder="Select" 
                                         className="" />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <Controller
                                name="Is_ErrorLane"
                                control={form.control}
                                rules={{ 
                                    required: 'Error lane option is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Is Error Lane?</label>
                                        <Dropdown value={field.value} 
                                         onChange={(e) => {
                                            field.onChange(e.target.value)
                                        }} 
                                        options={[{'name': 'No', 'value': 0}, {'name':'Yes', 'value': 1}]} optionLabel="name" 
                                        editable
                                         placeholder="Select" 
                                         className="" />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>

                    </div>
                    <Button label="Submit" loading={loading} type='submit' className="w-3 mt-3" ></Button>
                </div>
            </form>
        </>
    );
}
