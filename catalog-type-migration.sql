do $$
declare
  type_data_type text;
  type_schema_name text;
  type_name text;
  type_constraint record;
begin
  select data_type, udt_schema, udt_name
  into type_data_type, type_schema_name, type_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'catalog_items'
    and column_name = 'type';

  if not found then
    raise exception 'public.catalog_items.type was not found';
  end if;

  if type_data_type = 'USER-DEFINED' then
    execute format(
      'alter type %I.%I add value if not exists %L',
      type_schema_name,
      type_name,
      'special_food'
    );
  elsif type_data_type in ('text', 'character varying', 'character') then
    for type_constraint in
      select conname
      from pg_constraint
      where conrelid = 'public.catalog_items'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) ~* '\mtype\M'
        and pg_get_constraintdef(oid) ilike '%product%'
        and pg_get_constraintdef(oid) ilike '%room%'
    loop
      execute format(
        'alter table public.catalog_items drop constraint %I',
        type_constraint.conname
      );
    end loop;

    alter table public.catalog_items
      drop constraint if exists catalog_items_type_check;

    alter table public.catalog_items
      add constraint catalog_items_type_check
      check (type in ('product', 'room', 'special_food'));
  else
    raise exception 'Unsupported catalog_items.type data type: %', type_data_type;
  end if;
end
$$;
