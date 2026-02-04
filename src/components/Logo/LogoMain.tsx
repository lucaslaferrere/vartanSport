"use client";
// project-import
import {useAppSelector} from "@redux/hook";

const LogoMain = () => {
    const customization = useAppSelector((state) => state.customization);
    return (
        <img src={customization.logo} alt="SignZen" width="150"/>
    );
};

export default LogoMain;
