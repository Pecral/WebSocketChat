export class CustomJsonDeserializer {

    public static deserialize(data: string): any
    {
        return JSON.parse(data, CustomJsonDeserializer.reviveDateTime);
    }

    private static reviveDateTime(key: any, value: any): any 
    {
        if (typeof value === 'string' && key === 'timestamp')
        {
            return new Date(value);
        }

        return value;
    }	
}