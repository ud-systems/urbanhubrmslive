-- Fix the get_application_options function return type
DROP FUNCTION IF EXISTS get_application_options(TEXT);

CREATE OR REPLACE FUNCTION get_application_options(category_name TEXT)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    sort_order INTEGER,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ao.id::INTEGER,
        ao.name::TEXT,
        ao.sort_order::INTEGER,
        ao.active::BOOLEAN
    FROM application_options ao
    WHERE ao.category = category_name
    AND ao.active = true
    ORDER BY ao.sort_order, ao.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 