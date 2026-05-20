-- Recreate record_online_payment to use reference_number instead of reference
CREATE OR REPLACE FUNCTION public.record_online_payment(
  p_student_id UUID,
  p_term_id UUID,
  p_school_id UUID,
  p_amount NUMERIC,
  p_reference TEXT
) RETURNS JSON AS $$
DECLARE
  v_previous_arrears NUMERIC;
  v_arrears_paid NUMERIC;
  v_remaining_arrears NUMERIC;
  v_academic_year_id UUID;
  v_payment_id UUID;
BEGIN
  -- 1. Fetch student's current arrears
  SELECT fees_arrears INTO v_previous_arrears
  FROM public.students
  WHERE id = p_student_id;
  
  IF v_previous_arrears IS NULL THEN
    v_previous_arrears := 0;
  END IF;

  -- 2. Fetch academic year ID from the term
  SELECT academic_year_id INTO v_academic_year_id
  FROM public.terms
  WHERE id = p_term_id;

  -- 3. Calculate allocation (arrears paid first)
  v_arrears_paid := LEAST(p_amount, GREATEST(0, v_previous_arrears));
  v_remaining_arrears := GREATEST(0, v_previous_arrears - v_arrears_paid);

  -- 4. Reduce student's arrears in DB
  IF v_arrears_paid > 0 THEN
    UPDATE public.students
    SET fees_arrears = v_remaining_arrears
    WHERE id = p_student_id;
  END IF;

  -- 5. Insert fee payment record
  INSERT INTO public.fee_payments (
    school_id,
    student_id,
    term_id,
    academic_year_id,
    amount_paid,
    payment_date,
    payment_method,
    reference_number,
    notes,
    arrears_paid,
    arrears_balance_after
  ) VALUES (
    p_school_id,
    p_student_id,
    p_term_id,
    v_academic_year_id,
    p_amount,
    NOW(),
    'online',
    p_reference,
    'Online payment via Paystack. Ref: ' || p_reference,
    v_arrears_paid,
    v_remaining_arrears
  ) RETURNING id INTO v_payment_id;

  -- Return results
  RETURN json_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'allocation', json_build_object(
      'totalPaid', p_amount,
      'arrearsPaid', v_arrears_paid,
      'remainingArrears', v_remaining_arrears
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
