// project import
import Navigation from './Navigation';
import SimpleBarScroll from "@components/Third-Party/SimpleBarScroll";

// ==============================|| DRAWER CONTENT ||============================== //

export default function DrawerContent() {
    return (
        <SimpleBarScroll
            sx={{
                '& .simplebar-content': {
                    display: 'flex',
                    flexDirection: 'column',
                },
                height: {
                    xs: '100%',
                    md: 'calc(100vh - 70px)',
                    xl: 'calc(100vh - 70px)'
                }
            }}
        >
            <Navigation/>
        </SimpleBarScroll>
    );
}
