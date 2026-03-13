/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Precedence levels (lower = binds less tightly)
const PREC = {
  SEQ: 1, // e1; e2
  BINDING: 2, // let, if, match, fun, forall, exists
  ASCRIPTION: 3, // <: $:
  IFF: 4, // <==>
  IMPLIES: 5, // ==>
  DISJUNCTION: 6, // \/
  CONJUNCTION: 7, // /\
  ARROW: 8, // ->
  ASSIGN: 9, // :=
  PIPE: 10, // |> <|
  OR: 11, // ||
  AND: 12, // &&
  EQ: 13, // = < > <> <= >=
  DOLLAR: 14, // $
  CONS: 15, // ::
  APPEND: 16, // @ ^
  ADD: 17, // + -
  MUL: 18, // * / %
  POW: 19, // **
  APP: 20, // function application
  PREFIX: 21, // ! ~ ?
  DOT: 22, // e.field e.(i) e.[i]
  ATOMIC: 23,
};

module.exports = grammar({
  name: "fstar",

  externals: ($) => [$.block_comment],

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  word: ($) => $.lid,

  conflicts: ($) => [
    [$._atomic_pattern, $._identifier],
    [$._atomic_term, $._identifier],
    [$._atomic_term, $.uid_path],
    [$._atomic_term, $.uid_path, $.uid_path_dot_lid],
    [$._atomic_term, $.field_assignment],
    [$._atomic_term, $._identifier, $.field_declaration],
    [$.constructor, $._atomic_term, $.uid_path],
    [$.implicit_binder],
    [$._term, $._non_seq_term],
  ],

  rules: {
    source_file: ($) =>
      seq(optional($.module_declaration), repeat($._top_level)),

    _top_level: ($) => choice($._decl, $.pragma),

    // ─── Module ──────────────────────────────────────────────────────

    module_declaration: ($) => seq("module", $.uid_path),

    open_declaration: ($) => seq("open", $.uid_path),

    include_declaration: ($) => seq("include", $.uid_path),

    friend_declaration: ($) => seq("friend", $.uid_path),

    module_abbreviation: ($) => seq("module", $.uid, "=", $.uid_path),

    // ─── Declarations ────────────────────────────────────────────────

    _decl: ($) =>
      choice(
        $.open_declaration,
        $.include_declaration,
        $.friend_declaration,
        $.module_abbreviation,
        $.val_declaration,
        $.let_declaration,
        $.type_declaration,
        $.exception_declaration,
        $.assume_declaration,
        $.effect_declaration,
        $.class_declaration,
        $.attribute,
      ),

    val_declaration: ($) =>
      seq(repeat($.qualifier), "val", $._identifier, ":", $._term),

    let_declaration: ($) =>
      seq(
        repeat($.qualifier),
        "let",
        optional("rec"),
        $.let_binding,
        repeat(seq("and", $.let_binding)),
      ),

    let_binding: ($) =>
      seq(
        $._pattern_or_id,
        repeat($._binder),
        optional(seq(":", $._term)),
        "=",
        $._term,
      ),

    _pattern_or_id: ($) => choice($._identifier, $.operator_id, $._pattern),

    type_declaration: ($) =>
      seq(
        repeat($.qualifier),
        "type",
        $.lid,
        repeat($._binder),
        optional(seq(":", $._term)),
        optional(seq("=", choice($.inductive_body, $.record_type, $._term))),
      ),

    inductive_body: ($) =>
      seq(optional("|"), $.constructor, repeat(seq("|", $.constructor))),

    constructor: ($) =>
      seq(
        $.uid,
        choice(seq(":", $._term), seq("of", $._term), repeat($._atomic_term)),
      ),

    record_type: ($) =>
      seq(
        "{",
        optional(
          seq(
            $.field_declaration,
            repeat(seq(";", $.field_declaration)),
            optional(";"),
          ),
        ),
        "}",
      ),

    field_declaration: ($) =>
      seq(optional("mutable"), $.lid, ":", $._non_seq_term),

    exception_declaration: ($) =>
      seq("exception", $.uid, optional(seq("of", $._term))),

    assume_declaration: ($) =>
      seq(
        repeat($.qualifier),
        "assume",
        choice(
          seq("val", $._identifier, ":", $._term),
          seq("type", $.lid, repeat($._binder)),
          seq($._identifier, ":", $._term),
        ),
      ),

    effect_declaration: ($) =>
      seq(
        choice("new_effect", "layered_effect", "sub_effect", "effect"),
        $._effect_body,
      ),

    _effect_body: ($) => seq("{", repeat($._term), "}"),

    class_declaration: ($) =>
      seq(
        repeat($.qualifier),
        "class",
        $.lid,
        repeat($._binder),
        optional(seq(":", $._term)),
        "=",
        choice($.record_type, $._term),
      ),

    qualifier: ($) =>
      choice(
        "abstract",
        "inline_for_extraction",
        "irreducible",
        "noextract",
        "private",
        "noeq",
        "unopteq",
        "total",
        "logic",
        "opaque",
        "reifiable",
        "reflectable",
        "unfold",
        "inline",
        "instance",
        "new",
        "unfoldable",
        "default_effect",
      ),

    attribute: ($) =>
      choice(
        seq("[@@", $._term, "]"),
        seq("[@@@", $._term, "]"),
        seq("[@", $._term, "]"),
      ),

    // ─── Expressions ─────────────────────────────────────────────────

    _term: ($) =>
      choice(
        $._atomic_term,
        $.application,
        $.fun_expression,
        $.if_expression,
        $.let_expression,
        $.match_expression,
        $.try_expression,
        $.forall_expression,
        $.exists_expression,
        $.assert_expression,
        $.calc_expression,
        $.begin_end_expression,
        $.seq_expression,
        $.binary_expression,
        $.unary_expression,
        $.ascription_expression,
        $.assign_expression,
        $.field_access,
        $.array_access,
        $.dot_paren_access,
        $.refinement_type,
        $.type_annotation,
      ),

    _atomic_term: ($) =>
      choice(
        $.lid,
        $.uid,
        $.uid_path_dot_lid,
        $.uid_path,
        $.integer,
        $.string,
        $.char,
        $.boolean,
        $.unit,
        $.list_expression,
        $.record_expression,
        $.paren_expression,
        $.tuple_expression,
        $.type_variable,
        $.operator_id,
        $.hash_ident,
        $.wildcard,
      ),

    seq_expression: ($) => prec.right(PREC.SEQ, seq($._term, ";", $._term)),

    fun_expression: ($) =>
      prec.right(PREC.BINDING, seq("fun", repeat1($._binder), "->", $._term)),

    if_expression: ($) =>
      prec.right(
        PREC.BINDING,
        seq("if", $._term, "then", $._term, optional(seq("else", $._term))),
      ),

    let_expression: ($) =>
      prec.right(
        PREC.BINDING,
        seq(
          "let",
          optional("rec"),
          $.let_binding,
          repeat(seq("and", $.let_binding)),
          "in",
          $._term,
        ),
      ),

    match_expression: ($) =>
      prec.right(
        PREC.BINDING,
        seq(
          "match",
          $._term,
          optional(seq("returns", $._term)),
          "with",
          optional("|"),
          optional(seq($.match_branch, repeat(seq("|", $.match_branch)))),
        ),
      ),

    match_branch: ($) =>
      seq($._pattern, optional(seq("when", $._term)), "->", $._term),

    try_expression: ($) =>
      prec.right(
        PREC.BINDING,
        seq(
          "try",
          $._term,
          "with",
          optional("|"),
          $.match_branch,
          repeat(seq("|", $.match_branch)),
        ),
      ),

    forall_expression: ($) =>
      prec.right(PREC.BINDING, seq("forall", repeat1($._binder), ".", $._term)),

    exists_expression: ($) =>
      prec.right(PREC.BINDING, seq("exists", repeat1($._binder), ".", $._term)),

    assert_expression: ($) =>
      prec.right(
        PREC.BINDING,
        seq(
          choice("assert", "assert_norm", "assume"),
          $._term,
          optional(seq("by", $._term)),
        ),
      ),

    calc_expression: ($) =>
      prec.right(
        PREC.BINDING,
        seq("calc", "(", $._term, ")", "{", repeat($._term), "}"),
      ),

    begin_end_expression: ($) =>
      prec(PREC.BINDING, seq("begin", $._term, "end")),

    binary_expression: ($) =>
      choice(
        // Logical connectives
        prec.left(PREC.IFF, seq($._term, "<==>", $._term)),
        prec.right(PREC.IMPLIES, seq($._term, "==>", $._term)),
        prec.left(PREC.DISJUNCTION, seq($._term, "\\/", $._term)),
        prec.left(PREC.CONJUNCTION, seq($._term, "/\\", $._term)),

        // Arrow
        prec.right(PREC.ARROW, seq($._term, "->", $._term)),

        // Pipe
        prec.left(PREC.PIPE, seq($._term, "|>", $._term)),
        prec.right(PREC.PIPE, seq($._term, "<|", $._term)),

        // Boolean operators
        prec.left(PREC.OR, seq($._term, "||", $._term)),
        prec.left(PREC.AND, seq($._term, "&&", $._term)),

        // Comparison
        prec.left(PREC.EQ, seq($._term, "=", $._term)),
        prec.left(PREC.EQ, seq($._term, "<>", $._term)),
        prec.left(PREC.EQ, seq($._term, "<", $._term)),
        prec.left(PREC.EQ, seq($._term, ">", $._term)),
        prec.left(PREC.EQ, seq($._term, "<=", $._term)),
        prec.left(PREC.EQ, seq($._term, ">=", $._term)),
        prec.left(PREC.EQ, seq($._term, "==", $._term)),
        prec.left(PREC.EQ, seq($._term, "=!=", $._term)),

        // Dollar
        prec.right(PREC.DOLLAR, seq($._term, "$", $._term)),

        // Cons
        prec.right(PREC.CONS, seq($._term, "::", $._term)),

        // Append
        prec.right(PREC.APPEND, seq($._term, "@", $._term)),
        prec.right(PREC.APPEND, seq($._term, "^", $._term)),

        // Arithmetic
        prec.left(PREC.ADD, seq($._term, "+", $._term)),
        prec.left(PREC.ADD, seq($._term, "-", $._term)),

        // Multiplicative
        prec.left(PREC.MUL, seq($._term, "*", $._term)),
        prec.left(PREC.MUL, seq($._term, "/", $._term)),
        prec.left(PREC.MUL, seq($._term, "%", $._term)),

        // Power
        prec.right(PREC.POW, seq($._term, "**", $._term)),
      ),

    unary_expression: ($) =>
      prec(PREC.PREFIX, seq(choice("!", "~", "-"), $._term)),

    ascription_expression: ($) =>
      prec.left(PREC.ASCRIPTION, seq($._term, "<:", $._term)),

    assign_expression: ($) =>
      prec.right(PREC.ASSIGN, seq($._term, ":=", $._term)),

    type_annotation: ($) => prec.right(PREC.ARROW, seq($._term, ":", $._term)),

    application: ($) => prec.left(PREC.APP, seq($._term, $._atomic_term)),

    field_access: ($) => prec.left(PREC.DOT, seq($._term, ".", $.lid)),

    array_access: ($) =>
      prec.left(PREC.DOT, seq($._term, ".", "[", $._term, "]")),

    dot_paren_access: ($) =>
      prec.left(PREC.DOT, seq($._term, ".", "(", $._term, ")")),

    refinement_type: ($) => seq($._identifier, ":", $._term, "{", $._term, "}"),

    paren_expression: ($) => seq("(", $._term, ")"),

    tuple_expression: ($) =>
      prec(PREC.ATOMIC, seq("(", $._term, repeat1(seq(",", $._term)), ")")),

    list_expression: ($) =>
      seq(
        "[",
        optional(
          seq(
            $._non_seq_term,
            repeat(seq(";", $._non_seq_term)),
            optional(";"),
          ),
        ),
        "]",
      ),

    record_expression: ($) =>
      seq(
        "{",
        optional(seq($._term, "with")),
        $.field_assignment,
        repeat(seq(";", $.field_assignment)),
        optional(";"),
        "}",
      ),

    _non_seq_term: ($) =>
      choice(
        $._atomic_term,
        $.application,
        $.fun_expression,
        $.if_expression,
        $.let_expression,
        $.match_expression,
        $.try_expression,
        $.forall_expression,
        $.exists_expression,
        $.assert_expression,
        $.calc_expression,
        $.begin_end_expression,
        $.binary_expression,
        $.unary_expression,
        $.ascription_expression,
        $.assign_expression,
        $.field_access,
        $.array_access,
        $.dot_paren_access,
        $.refinement_type,
        $.type_annotation,
      ),

    field_assignment: ($) => seq($.lid, "=", $._non_seq_term),

    // ─── Patterns ────────────────────────────────────────────────────

    _pattern: ($) =>
      choice(
        $._atomic_pattern,
        $.constructor_pattern,
        $.cons_pattern,
        $.or_pattern,
        $.as_pattern,
        $.typed_pattern,
        $.tuple_pattern,
      ),

    _atomic_pattern: ($) =>
      choice(
        $.lid,
        $.uid,
        $.wildcard,
        $.integer,
        $.string,
        $.char,
        $.boolean,
        $.unit,
        $.list_pattern,
        $.record_pattern,
        $.paren_pattern,
      ),

    constructor_pattern: ($) =>
      prec.left(PREC.APP, seq($.uid, repeat1($._atomic_pattern))),

    cons_pattern: ($) =>
      prec.right(PREC.CONS, seq($._pattern, "::", $._pattern)),

    or_pattern: ($) => prec.left(1, seq($._pattern, "|", $._pattern)),

    as_pattern: ($) => prec.left(2, seq($._pattern, "as", $.lid)),

    typed_pattern: ($) => seq("(", $._pattern, ":", $._term, ")"),

    tuple_pattern: ($) =>
      prec(
        PREC.ATOMIC,
        seq("(", $._pattern, repeat1(seq(",", $._pattern)), ")"),
      ),

    list_pattern: ($) =>
      seq(
        "[",
        optional(seq($._pattern, repeat(seq(";", $._pattern)), optional(";"))),
        "]",
      ),

    record_pattern: ($) =>
      seq(
        "{",
        $.field_pattern,
        repeat(seq(";", $.field_pattern)),
        optional(";"),
        "}",
      ),

    field_pattern: ($) => seq($.lid, "=", $._pattern),

    paren_pattern: ($) => seq("(", $._pattern, ")"),

    // ─── Binders ─────────────────────────────────────────────────────

    _binder: ($) =>
      choice(
        $.binder,
        $.implicit_binder,
        $.typeclass_binder,
        $._atomic_pattern,
      ),

    binder: ($) =>
      seq(
        "(",
        $._identifier,
        ":",
        $._term,
        optional(seq("{", $._term, "}")),
        ")",
      ),

    implicit_binder: ($) =>
      choice(
        seq("#", $._identifier, optional(seq(":", $._term))),
        seq("(#", $._identifier, ":", $._term, ")"),
      ),

    typeclass_binder: ($) => seq("{|", $._identifier, ":", $._term, "|}"),

    // ─── Pragmas ─────────────────────────────────────────────────────

    pragma: ($) =>
      choice(
        seq("#set-options", $.string),
        seq("#reset-options", optional($.string)),
        seq("#push-options", $.string),
        "#pop-options",
        "#restart-solver",
      ),

    // ─── Identifiers ─────────────────────────────────────────────────

    _identifier: ($) => choice($.lid, $.uid_path_dot_lid),

    // Lowercase identifier
    lid: (_) => /[a-z_][a-zA-Z0-9_']*|_/,

    // Uppercase identifier
    uid: (_) => /[A-Z][a-zA-Z0-9_']*/,

    // Qualified path (Module.Sub.Module)
    uid_path: ($) => prec.left(seq($.uid, repeat(seq(".", $.uid)))),

    // Qualified name ending in lowercase (Module.name)
    uid_path_dot_lid: ($) => seq($.uid, repeat(seq(".", $.uid)), ".", $.lid),

    type_variable: (_) => /'[a-zA-Z][a-zA-Z0-9_]*/,

    wildcard: (_) => "_",

    operator_id: (_) => /`[^`]+`/,

    hash_ident: ($) => seq("#", $._atomic_term),

    // ─── Literals ────────────────────────────────────────────────────

    integer: (_) =>
      token(
        choice(
          // Decimal with optional suffix
          /[0-9][0-9_]*([uU]?[lLysnYSN]|[uU][sS]|[uU][lL])?/,
          // Hexadecimal
          /0[xX][0-9a-fA-F][0-9a-fA-F_]*([uU]?[lLysnYSN]|[uU][sS]|[uU][lL])?/,
          // Octal
          /0[oO][0-7][0-7_]*([uU]?[lLysnYSN]|[uU][sS]|[uU][lL])?/,
          // Binary
          /0[bB][01][01_]*([uU]?[lLysnYSN]|[uU][sS]|[uU][lL])?/,
        ),
      ),

    string: (_) => token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    char: (_) => token(seq("'", choice(/[^'\\]/, /\\./), "'")),

    boolean: (_) => choice("true", "false"),

    unit: (_) => "()",

    // ─── Comments ────────────────────────────────────────────────────

    line_comment: (_) => token(seq("//", /[^\n]*/)),
  },
});
