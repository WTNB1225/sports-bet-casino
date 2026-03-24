import { useParams } from "react-router";

export default function Sport() {
    const { sportId } = useParams();
    console.log("Sport component rendered with params:", { sportId });
    return (
        <div className="flex min-h-full items-center justify-center">
            <h1>{sportId}</h1>
        </div>
    )
}