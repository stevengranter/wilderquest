import cx from 'clsx'
import CollectionsList from '@/components/collections/CollectionsList' // You might need to install 'clsx' or 'cx' if you haven't already

type CollectionsDrawerProps = {
    isVisible: boolean;
};

export default function CollectionsDrawer({ isVisible }: CollectionsDrawerProps) {


    return (
        <div
            className={cx(
                'fixed bottom-0 left-0 right-0 p-4 flex justify-around items-center',
                'bg-main', // Assuming 'bg-main' is a custom color defined in your Tailwind config
                {
                    'hidden': !isVisible, // Hide when not visible
                    // Add other visibility/animation classes here if needed, e.g., for transitions
                    'translate-y-full': !isVisible, // To slide out of view
                    'translate-y-0': isVisible,    // To slide into view
                    'transition-transform duration-300 ease-out': true, // For the transition effect
                },
            )}
        >
            <CollectionsList />
        </div>
    )
}