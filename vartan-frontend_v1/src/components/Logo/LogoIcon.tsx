"use client";
// material-ui
import {useAppSelector} from "@redux/hook";

// ==============================|| LOGO ICON SVG ||============================== //

const LogoIcon = () => {
    const customization = useAppSelector((state) => state.customization);
    return (
        <img src={customization.icon} alt="SignZen" width="150"/>
    );
};

export default LogoIcon;
